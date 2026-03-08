import {
  cre,
  ok,
  consensusIdenticalAggregation,
  type Runtime,
  type HTTPSendRequester,
  bytesToHex,
  prepareReportRequest,
  getNetwork,
} from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters, encodeFunctionData, keccak256, toHex } from "viem";
import type {
  SenateConfig,
  AgentResult,
  SimulationResult,
  AttackMatch,
  ProposalData,
  SenateVerdict,
  SenateResult,
} from "./types";
import { getHistoricalAttacksContext } from "./attacks";
import { runBatchedDebate, runGeminiAttackScan } from "./gemini";

// ── Tenderly VTN Simulation (HTTP Call #1) ──────────────────────────────

const GOVERNOR_ABI = [{
  name: 'createProposal',
  type: 'function',
  inputs: [
    { name: 'title', type: 'string' },
    { name: 'protocol', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'votingBlocks', type: 'uint256' },
  ],
  outputs: [{ name: '', type: 'uint256' }],
  stateMutability: 'nonpayable',
}] as const;

const DEPLOYER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

interface VtnSendResult {
  txHash: string;
}

interface VtnReceiptResult {
  gasUsed: number;
  logCount: number;
  success: boolean;
}

const buildVtnSendTx =
  (proposalData: ProposalData) =>
  (sendRequester: HTTPSendRequester, config: SenateConfig): VtnSendResult => {
    const governorAddr = config.senateGovernorAddress;
    const calldata = encodeFunctionData({
      abi: GOVERNOR_ABI,
      functionName: 'createProposal',
      args: [
        proposalData.title,
        proposalData.protocol || 'defi',
        proposalData.description,
        BigInt(50400),
      ],
    });

    const rpcBody = JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_sendTransaction",
      params: [{ from: DEPLOYER, to: governorAddr, data: calldata, gas: "0x7A1200" }],
      id: 1,
    });

    const bodyBytes = new TextEncoder().encode(rpcBody);
    const body = Buffer.from(bodyBytes).toString("base64");

    const resp = sendRequester
      .sendRequest({
        url: config.vtnRpcUrl,
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      })
      .result();

    const respText = new TextDecoder().decode(resp.body);
    if (!ok(resp)) throw new Error(`VTN RPC error: ${resp.statusCode} - ${respText}`);

    const parsed = JSON.parse(respText);
    if (parsed?.error) throw new Error(`VTN sendTransaction error: ${parsed.error.message}`);

    return { txHash: parsed?.result || "0x" };
  };

const buildVtnGetReceipt =
  (txHash: string) =>
  (sendRequester: HTTPSendRequester, config: SenateConfig): VtnReceiptResult => {
    const rpcBody = JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getTransactionReceipt",
      params: [txHash],
      id: 2,
    });

    const bodyBytes = new TextEncoder().encode(rpcBody);
    const body = Buffer.from(bodyBytes).toString("base64");

    const resp = sendRequester
      .sendRequest({
        url: config.vtnRpcUrl,
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      })
      .result();

    const respText = new TextDecoder().decode(resp.body);
    const parsed = JSON.parse(respText);
    const receipt = parsed?.result;

    return {
      gasUsed: receipt ? parseInt(receipt.gasUsed, 16) : 150000,
      logCount: receipt?.logs?.length || 0,
      success: receipt?.status === "0x1",
    };
  };

function simulateOnVTN(runtime: Runtime<SenateConfig>, proposalData: ProposalData): SimulationResult {
  const httpClient = new cre.capabilities.HTTPClient();

  runtime.log("  Sending proposal creation tx to VTN Governor...");
  const sendResult = httpClient
    .sendRequest(
      runtime,
      buildVtnSendTx(proposalData),
      consensusIdenticalAggregation<VtnSendResult>()
    )(runtime.config)
    .result();

  runtime.log(`  VTN TX Hash: ${sendResult.txHash}`);

  runtime.log("  Fetching transaction receipt from VTN...");
  const receipt = httpClient
    .sendRequest(
      runtime,
      buildVtnGetReceipt(sendResult.txHash),
      consensusIdenticalAggregation<VtnReceiptResult>()
    )(runtime.config)
    .result();

  runtime.log(`  Receipt: gas=${receipt.gasUsed} logs=${receipt.logCount} success=${receipt.success}`);

  const gasNorm = Math.min(receipt.gasUsed / 500000, 1);
  const logNorm = Math.min(receipt.logCount / 5, 1);

  const tvlChangePct = Math.round((receipt.logCount * 2.5 + gasNorm * 3) * 10) / 10;
  const liquidationRisk = Math.min(100, Math.round(gasNorm * 45 + logNorm * 30 + (receipt.success ? 0 : 25)));
  const priceImpactPct = Math.round(Math.min(5, logNorm * 2 + gasNorm * 1.5) * 100) / 100;
  const collateralRatioAfter = Math.round((1.52 - liquidationRisk * 0.003) * 100) / 100;

  return {
    forkId: sendResult.txHash,
    tvlChangePct,
    liquidationRisk,
    priceImpactPct,
    gasUsed: receipt.gasUsed,
    affectedAddresses: Math.max(receipt.logCount * 2, Math.round(gasNorm * 50)),
    collateralRatioBefore: 1.52,
    collateralRatioAfter: Math.max(1.0, collateralRatioAfter),
    stateDiffCount: receipt.logCount + Math.round(gasNorm * 10),
  };
}

// ── Webhook Notification (HTTP Call #3) ──────────────────────────────────

const buildWebhookRequest =
  (payload: object) =>
  (sendRequester: HTTPSendRequester, config: SenateConfig): { sent: boolean } => {
    const bodyBytes = new TextEncoder().encode(
      JSON.stringify({ ...payload, timestamp: new Date().toISOString() })
    );
    const body = Buffer.from(bodyBytes).toString("base64");

    sendRequester
      .sendRequest({
        url: config.webhookUrl,
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      })
      .result();

    return { sent: true };
  };

// ── Verdict Computation ──────────────────────────────────────────────────

function computeVerdict(agents: AgentResult[], attackMatches: AttackMatch[]): SenateVerdict {
  const votes = { 0: 0, 1: 0, 2: 0 };
  let totalConfidence = 0;
  let weightedRisk = 0;

  for (const a of agents) {
    votes[a.vote as 0 | 1 | 2]++;
    totalConfidence += a.confidence;
    if (a.vote === 1) weightedRisk += a.confidence;
  }

  let riskBoost = 0;
  if (attackMatches.length > 0) {
    const maxSimilarity = Math.max(...attackMatches.map((m) => m.similarity));
    riskBoost = Math.round(maxSimilarity * 0.2);
  }

  const recommendation = votes[0] >= votes[1] ? 0 : 1;
  const avgConfidence = totalConfidence / agents.length;
  const riskScore = Math.min(100, Math.round(weightedRisk / agents.length + votes[1] * 15 + riskBoost));

  const voteLabels = ["PASS", "FAIL", "ABSTAIN"];
  const voteBreakdown: Record<string, number> = {};
  for (const a of agents) voteBreakdown[a.agentId] = a.vote;

  const attackWarning = attackMatches.length > 0
    ? ` ATTACK PATTERN ALERT: ${attackMatches.length} historical attack(s) matched.`
    : "";

  return {
    recommendation,
    riskScore,
    votes: voteBreakdown,
    attackMatches,
    summary: `Senate recommends ${voteLabels[recommendation]} with risk score ${riskScore}/100. Vote: ${votes[0]} PASS, ${votes[1]} FAIL, ${votes[2]} ABSTAIN. Avg confidence: ${avgConfidence.toFixed(0)}%.${attackWarning}`,
  };
}

// ── Main Pipeline (5 HTTP calls total) ──────────────────────────────────
//    #1a: VTN simulation – eth_sendTransaction (HTTPClient → VTN RPC)
//    #1b: VTN simulation – eth_getTransactionReceipt (HTTPClient → VTN RPC)
//    #2: Gemini attack pattern analysis (HTTPClient with API key)
//    #3: Gemini batched debate (HTTPClient with API key)
//    #4: Final webhook notification (HTTPClient)

export function runSenatePipeline(
  runtime: Runtime<SenateConfig>,
  proposalData: ProposalData
): SenateResult {
  const evmConfig = runtime.config.evms[0];
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evmConfig.chainSelectorName,
    isTestnet: true,
  });

  if (!network) throw new Error(`Network not found: ${evmConfig.chainSelectorName}`);

  const evmClient = new cre.capabilities.EVMClient(network.chainSelector.selector);
  const calldataSection = proposalData.calldata
    ? `\n\nEXECUTABLE CALLDATA:\n${proposalData.calldata}`
    : "";
  const proposalText = `${proposalData.title}\n\n${proposalData.description}${calldataSection}`;

  runtime.log("═══ SENATE Pipeline Started ═══");
  runtime.log(`Proposal: ${proposalData.title}`);

  const pipelineStartTime = Date.now();
  let stepStartTime = Date.now();

  // ── HTTP Call #1: Tenderly VTN Simulation ──────────────────────────
  runtime.log("[Step 1/7] Simulating on Tenderly Virtual TestNet...");
  stepStartTime = Date.now();
  const simResults = simulateOnVTN(runtime, proposalData);
  const simDuration = Date.now() - stepStartTime;
  runtime.log(`[Step 1/7] Simulation complete: gas ${simResults.gasUsed}, risk ${simResults.liquidationRisk} (${simDuration}ms)`);

  // ── HTTP Call #2: Gemini Attack Pattern Analysis ───────────────────
  runtime.log("[Step 2/7] Scanning for historical attack patterns via Gemini...");
  stepStartTime = Date.now();
  const attackContext = getHistoricalAttacksContext();
  const attackMatches = runGeminiAttackScan(runtime, proposalData, simResults, attackContext);
  const attackDuration = Date.now() - stepStartTime;
  if (attackMatches.length > 0) {
    runtime.log(`[Step 2/7] ALERT: ${attackMatches.length} pattern(s) matched! (${attackDuration}ms)`);
    for (const m of attackMatches) runtime.log(`  - ${m.name} (${m.similarity}% similarity)`);
  } else {
    runtime.log(`[Step 2/7] No historical attack patterns detected. (${attackDuration}ms)`);
  }

  // ── HTTP Call #3: Batched Gemini Debate (single API call) ──────────
  runtime.log("[Step 3/7] Running AI Senate debate (batched)...");
  stepStartTime = Date.now();
  const debateResult = runBatchedDebate(runtime, proposalText, simResults, attackMatches);
  const debateDuration = Date.now() - stepStartTime;
  runtime.log(`[Step 3/7] Debate complete (${debateDuration}ms)`);

  const verdict = computeVerdict(debateResult.agents, attackMatches);
  verdict.recommendation = debateResult.verdict.recommendation;
  verdict.riskScore = debateResult.verdict.riskScore;
  verdict.summary = debateResult.verdict.summary;
  runtime.log(`[Step 4/7] Verdict: ${verdict.summary}`);

  // ── DON-Signed Report (runtime.report — NOT an HTTP call) ─────────
  runtime.log("[Step 5/7] Generating DON-signed report...");
  stepStartTime = Date.now();
  const proposalHash = keccak256(
    toHex(`${proposalData.protocol}-proposal-${proposalData.proposalId || proposalData.id || "0"}`)
  );
  const contentHash = keccak256(
    toHex(JSON.stringify({ verdict: verdict.summary, riskScore: verdict.riskScore }))
  );

  const reportPayload = encodeAbiParameters(
    parseAbiParameters("bytes32, bytes32, uint8, uint8"),
    [proposalHash, contentHash, verdict.recommendation, verdict.riskScore]
  );

  const report = runtime.report(prepareReportRequest(reportPayload as `0x${string}`)).result();
  const reportDuration = Date.now() - stepStartTime;
  runtime.log(`[Step 5/7] Report generated (${reportDuration}ms)`);

  // ── EVM Write (writeReport — NOT an HTTP call) ─────────────────────
  runtime.log(`[Step 6/7] Publishing to SenateReport.sol at ${evmConfig.senateReportAddress}...`);
  stepStartTime = Date.now();
  const writeResult = evmClient
    .writeReport(runtime, {
      receiver: evmConfig.senateReportAddress,
      report,
      gasConfig: { gasLimit: evmConfig.gasLimit },
    })
    .result();

  const txHash = bytesToHex(writeResult.txHash || new Uint8Array(32));
  const writeDuration = Date.now() - stepStartTime;
  runtime.log(`[Step 6/7] Report published! TX: ${txHash} (${writeDuration}ms)`);

  // ── HTTP Call #4: Final Webhook Notification ───────────────────────
  runtime.log("[Step 7/7] Notifying webhook...");
  const totalDuration = Date.now() - pipelineStartTime;
  try {
    const httpClient = new cre.capabilities.HTTPClient();
    const vtnExplorerBase = `https://dashboard.tenderly.co/${runtime.config.tenderlyAccount}/${runtime.config.tenderlyProject}/testnet/793f498b-03f5-4fc8-9df7-c06cef7727ff`;
    const simTxUrl = `${vtnExplorerBase}/tx/${simResults.forkId}`;
    const reportTxUrl = `${vtnExplorerBase}/tx/${txHash}`;
    httpClient
      .sendRequest(
        runtime,
        buildWebhookRequest({
          type: "report_published",
          data: {
            txHash,
            verdict,
            attackMatches,
            proposalId: proposalData.id,
            title: proposalData.title,
            protocol: proposalData.protocol || "defi",
            openingStatements: debateResult.openingStatements,
            agents: debateResult.agents,
            counterArguments: debateResult.counterArguments,
            review: debateResult.review,
            simulation: {
              forkId: simResults.forkId,
              forkUrl: simTxUrl,
              simulationUrl: reportTxUrl,
              metrics: simResults,
            },
            timing: {
              simulation: simDuration,
              attackScan: attackDuration,
              debate: debateDuration,
              report: reportDuration,
              write: writeDuration,
              total: totalDuration,
            },
          },
        }),
        consensusIdenticalAggregation<{ sent: boolean }>()
      )(runtime.config)
      .result();
  } catch {
    runtime.log("[Webhook] Final notification failed (non-fatal)");
  }

  runtime.log(`═══ SENATE Pipeline Complete (${totalDuration}ms) ═══`);
  return { txHash, verdict };
}
