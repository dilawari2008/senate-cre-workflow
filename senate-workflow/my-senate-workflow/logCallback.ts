import {
  cre,
  type Runtime,
  type EVMLog,
  getNetwork,
  bytesToHex,
  encodeCallMsg,
  LAST_FINALIZED_BLOCK_NUMBER,
} from "@chainlink/cre-sdk";
import {
  parseAbi,
  encodeFunctionData,
  decodeFunctionResult,
  zeroAddress,
  type Address,
} from "viem";
import type { SenateConfig, SenateResult } from "./types";
import { runSenatePipeline } from "./pipeline";

const GOVERNOR_ABI = parseAbi([
  "function getProposal(uint256 _proposalId) view returns ((string title, string protocol, string description, address proposer, uint256 startBlock, uint256 endBlock, bool exists))",
]);

export function onLogTrigger(
  runtime: Runtime<SenateConfig>,
  log: EVMLog
): SenateResult {
  runtime.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  runtime.log("CRE Workflow: EVM Log Trigger — ProposalCreated");
  runtime.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const proposalIdHex = bytesToHex(log.topics[1]);
    const proposalId = BigInt(proposalIdHex);
    const proposerHex = bytesToHex(log.topics[2]);
    const proposer = ("0x" + proposerHex.slice(26)) as Address;

    runtime.log(
      `On-chain ProposalCreated: ID=${proposalId}, proposer=${proposer}`
    );

    // EVM Read: fetch full proposal data from SenateGovernor.sol
    runtime.log("Reading proposal from SenateGovernor via EVM Read...");

    const evmConfig = runtime.config.evms[0];
    const network = getNetwork({
      chainFamily: "evm",
      chainSelectorName: evmConfig.chainSelectorName,
      isTestnet: true,
    });

    if (!network) {
      throw new Error(`Network not found: ${evmConfig.chainSelectorName}`);
    }

    const evmClient = new cre.capabilities.EVMClient(
      network.chainSelector.selector
    );

    const callData = encodeFunctionData({
      abi: GOVERNOR_ABI,
      functionName: "getProposal",
      args: [proposalId],
    });

    const readResult = evmClient
      .callContract(runtime, {
        call: encodeCallMsg({
          from: zeroAddress,
          to: runtime.config.senateGovernorAddress as Address,
          data: callData,
        }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result();

    const decoded = decodeFunctionResult({
      abi: GOVERNOR_ABI,
      functionName: "getProposal",
      data: bytesToHex(readResult.data),
    }) as {
      title: string;
      protocol: string;
      description: string;
      proposer: string;
      startBlock: bigint;
      endBlock: bigint;
      exists: boolean;
    };

    runtime.log(
      `Read proposal: "${decoded.title}" (${decoded.protocol}) from ${decoded.proposer}`
    );

    return runSenatePipeline(runtime, {
      id: proposalId.toString(),
      proposalId: proposalId.toString(),
      title: decoded.title,
      protocol: decoded.protocol,
      description: decoded.description,
      proposer: decoded.proposer,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    runtime.log(`[ERROR] ${msg}`);
    throw err;
  }
}
