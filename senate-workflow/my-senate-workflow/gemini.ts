import {
  cre,
  ok,
  consensusIdenticalAggregation,
  type Runtime,
  type HTTPSendRequester,
} from "@chainlink/cre-sdk";
import type { SenateConfig, AgentResult, SimulationResult, AttackMatch, ProposalData, ChairpersonReview, ChairpersonVerdict } from "./types";

interface GeminiApiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

interface GeminiCallResult {
  statusCode: number;
  text: string;
}

export interface BatchedDebateResult {
  openingStatements: AgentResult[];
  agents: AgentResult[];
  review: ChairpersonReview;
  verdict: ChairpersonVerdict;
  counterArguments: AgentResult[];
}

const buildGeminiRequest =
  (systemPrompt: string, userPrompt: string, apiKey: string) =>
  (sendRequester: HTTPSendRequester, config: SenateConfig): GeminiCallResult => {
    const model = config.geminiModel || "gemini-2.5-flash";
    const requestData = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
    };

    const bodyBytes = new TextEncoder().encode(JSON.stringify(requestData));
    const body = Buffer.from(bodyBytes).toString("base64");

    const resp = sendRequester
      .sendRequest({
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
      })
      .result();

    const bodyText = new TextDecoder().decode(resp.body);

    if (!ok(resp)) {
      throw new Error(`Gemini API error: ${resp.statusCode} - ${bodyText}`);
    }

    const apiResponse = JSON.parse(bodyText) as GeminiApiResponse;
    const text = apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { statusCode: resp.statusCode, text };
  };

const SYSTEM_PROMPT = `You are the SENATE governance analysis system. You simulate a debate between 5 AI agents analyzing DeFi governance proposals.

CRITICAL: Every governance proposal has TWO parts — a human-readable DESCRIPTION and the EXECUTABLE CALLDATA (the actual code that runs on-chain). You MUST analyze BOTH. If the calldata contradicts or does not match the description, this is a MAJOR RED FLAG and likely a governance attack. Agents must call this out explicitly.

AGENTS:
1. Caesar "The Bull" — growth-first DeFi maximalist. Biased toward PASS for yield/growth.
2. Brutus "The Bear" — risk-first security researcher. Expert on historical DeFi attacks (Beanstalk $182M flash loan, Tornado Cash malicious proposal, Build Finance hostile DAO takeover, Compound Prop 289 whale manipulation, Mango Markets $114M exploit). References attack parallels. ALWAYS cross-checks description against calldata.
3. Cassius "The Quant" — emotionless quantitative analyst. Only cares about EV, probability, sigma events. Verifies calldata parameters are mathematically consistent with description.
4. Portia "The Defender" — community advocate. Considers governance culture, precedent, community health.
5. Angel "The Guardian" — impartial chairperson. Does NOT vote. Identifies disputes, poses counter-questions, delivers final verdict. If description-calldata mismatch is detected, MUST escalate severity.

DEBATE FLOW:
Phase 1: Each agent gives opening statement with vote (PASS/FAIL/ABSTAIN) and confidence (0-100).
Phase 2: Angel reviews. If agents disagree, Angel poses ONE counter-question to exactly ONE agent (the one whose position is most debatable or weakest).
Phase 3: The targeted agent MUST respond with a concise counter-argument (may change vote or double down).
Phase 4: Angel delivers final verdict with recommendation and risk score.

You MUST output valid JSON matching the exact schema requested.`;

function buildBatchPrompt(
  proposalText: string,
  simResults: SimulationResult,
  attackMatches: AttackMatch[]
): string {
  let attackContext = "";
  if (attackMatches.length > 0) {
    attackContext = `\n\nATTACK PATTERN ALERTS:\n${attackMatches
      .map((m) => `- ${m.name} (${m.similarity}% match): ${m.description} — Historical loss: ${m.historicalLoss}. Indicators: ${m.indicators.join(", ")}`)
      .join("\n")}\nAgents MUST address these patterns.`;
  }

  return `Analyze this governance proposal. Run the full 4-phase SENATE debate.
IMPORTANT: Compare the DESCRIPTION against the EXECUTABLE CALLDATA carefully. If they don't match, this is likely an attack.

PROPOSAL:
${proposalText}

SIMULATION RESULTS:
- TVL Change: ${simResults.tvlChangePct}%
- Liquidation Risk: ${simResults.liquidationRisk}/100
- Price Impact: ${simResults.priceImpactPct}%
- Gas Used: ${simResults.gasUsed}
- Affected Addresses: ${simResults.affectedAddresses}
- Collateral Ratio: ${simResults.collateralRatioBefore}x → ${simResults.collateralRatioAfter}x
- State Changes: ${simResults.stateDiffCount} slots
${attackContext}

Respond with this EXACT JSON structure:
{
  "openingStatements": [
    {
      "agentId": "caesar",
      "vote": 0,
      "confidence": 75,
      "argument": "2-3 sentence opening statement",
      "keyPoints": ["point1", "point2"]
    },
    {
      "agentId": "brutus",
      "vote": 1,
      "confidence": 85,
      "argument": "...",
      "keyPoints": ["..."]
    },
    {
      "agentId": "cassius",
      "vote": 0,
      "confidence": 70,
      "argument": "...",
      "keyPoints": ["..."]
    },
    {
      "agentId": "portia",
      "vote": 1,
      "confidence": 60,
      "argument": "...",
      "keyPoints": ["..."]
    }
  ],
  "review": {
    "hasDispute": true,
    "summary": "Angel's review of the positions",
    "disputeSummary": "The dispute between X and Y",
    "counterQuestion": "A targeted question for exactly ONE agent",
    "targetAgents": ["caesar"]
  },
  "counterArguments": [
    {
      "agentId": "caesar",
      "vote": 1,
      "confidence": 65,
      "argument": "concise counter-argument responding to Angel's question",
      "keyPoints": [],
      "changedVote": true
    }
  ],
  "verdict": {
    "recommendation": 1,
    "riskScore": 72,
    "summary": "2-3 sentence final verdict from Angel"
  }
}

RULES:
- vote: 0=PASS, 1=FAIL, 2=ABSTAIN
- openingStatements MUST include all 4 agents (caesar, brutus, cassius, portia) with their initial positions
- If all agents agree (same vote), set review.hasDispute=false, counterArguments=[]
- If dispute exists: targetAgents MUST contain exactly 1 agent ID (the one Angel challenges)
- counterArguments MUST contain exactly 1 entry matching the single targetAgent — that agent MUST respond
- changedVote=true ONLY if the agent changes their vote after the counter-question
- riskScore: 0-100. recommendation: match majority after counter-arguments
- KEEP IT SHORT: Each argument must be 1-2 sentences MAX. keyPoints: 2 items MAX
- If attack patterns detected, Brutus MUST reference them
- Output ONLY valid JSON, no markdown fences, no extra text`;
}

export function runBatchedDebate(
  runtime: Runtime<SenateConfig>,
  proposalText: string,
  simResults: SimulationResult,
  attackMatches: AttackMatch[]
): BatchedDebateResult {
  runtime.log("[Gemini] Running batched SENATE debate (single API call)...");

  const geminiApiKey = runtime.getSecret({ id: "GEMINI_API_KEY" }).result();
  const httpClient = new cre.capabilities.HTTPClient();
  const userPrompt = buildBatchPrompt(proposalText, simResults, attackMatches);

  const result = httpClient
    .sendRequest(
      runtime,
      buildGeminiRequest(SYSTEM_PROMPT, userPrompt, geminiApiKey.value),
      consensusIdenticalAggregation<GeminiCallResult>()
    )(runtime.config)
    .result();

  runtime.log("[Gemini] Debate response received, parsing...");

  let parsed: {
    openingStatements?: AgentResult[];
    review?: ChairpersonReview;
    counterArguments?: (AgentResult & { changedVote?: boolean })[];
    verdict?: ChairpersonVerdict;
  };

  try {
    let cleanText = result.text;
    const fenceMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) cleanText = fenceMatch[1];
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found");
    parsed = JSON.parse(jsonMatch[0]);
    runtime.log("[Gemini] JSON parsed successfully");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    runtime.log(`[Gemini] JSON parse error: ${msg}`);
    runtime.log(`[Gemini] Raw response (first 500 chars): ${result.text.slice(0, 500)}`);
    parsed = {};
  }

  // Parse opening statements
  const openingStatements: AgentResult[] = (parsed.openingStatements || []).map((a) => ({
    agentId: a.agentId || "unknown",
    vote: typeof a.vote === "number" ? a.vote : 2,
    confidence: a.confidence || 50,
    argument: a.argument || "No response",
    keyPoints: a.keyPoints || [],
  }));

  // Ensure all 4 agents have opening statements
  if (openingStatements.length < 4) {
    const defaults = ["caesar", "brutus", "cassius", "portia"];
    for (let i = openingStatements.length; i < 4; i++) {
      openingStatements.push({
        agentId: defaults[i],
        vote: 2,
        confidence: 50,
        argument: "Agent did not respond in time.",
        keyPoints: [],
      });
    }
  }

  const review: ChairpersonReview = parsed.review || {
    hasDispute: false,
    summary: "Review complete.",
  };

  // Build final agents array by merging opening statements with counter-arguments
  const agents: AgentResult[] = openingStatements.map(opening => ({ ...opening }));

  if (parsed.counterArguments && parsed.counterArguments.length > 0) {
    for (const ca of parsed.counterArguments) {
      const idx = agents.findIndex((a) => a.agentId === ca.agentId);
      if (idx >= 0) {
        const originalVote = agents[idx].vote;
        agents[idx] = {
          ...agents[idx],
          agentId: ca.agentId,
          vote: typeof ca.vote === "number" ? ca.vote : agents[idx].vote,
          confidence: ca.confidence || agents[idx].confidence,
          argument: ca.argument || agents[idx].argument,
          keyPoints: ca.keyPoints || [],
          changedVote: ca.changedVote || false,
          voteBefore: ca.changedVote ? originalVote : undefined,
        };
      }
    }
  }

  const verdict: ChairpersonVerdict = parsed.verdict || {
    recommendation: 1,
    riskScore: 50,
    summary: "Verdict rendered.",
  };

  const voteLabels = ["PASS", "FAIL", "ABSTAIN"];
  for (const a of agents) {
    const changeInfo = a.changedVote ? ` [CHANGED from ${voteLabels[a.voteBefore ?? 2]}]` : "";
    runtime.log(`  ${a.agentId}: ${voteLabels[a.vote]} (${a.confidence}%)${changeInfo}`);
  }
  runtime.log(`  Angel verdict: ${voteLabels[verdict.recommendation]} — risk ${verdict.riskScore}/100`);

  // Collect counter-arguments separately (including agents who didn't change vote)
  const counterArguments: AgentResult[] = (parsed.counterArguments || []).map((ca) => ({
    agentId: ca.agentId || "unknown",
    vote: typeof ca.vote === "number" ? ca.vote : 2,
    confidence: ca.confidence || 50,
    argument: ca.argument || "No response",
    keyPoints: ca.keyPoints || [],
    changedVote: ca.changedVote || false,
  }));

  return { openingStatements, agents, review, verdict, counterArguments };
}

const ATTACK_SCAN_SYSTEM = `You are a DeFi security analyst specializing in governance attack detection. You compare new governance proposals against historical governance attacks to identify patterns, risks, and similarities.

You MUST output valid JSON only — no markdown fences, no explanation text.`;

export function runGeminiAttackScan(
  runtime: Runtime<SenateConfig>,
  proposalData: ProposalData,
  simResults: SimulationResult,
  historicalAttacksContext: string
): AttackMatch[] {
  runtime.log("[Gemini] Running attack pattern analysis...");

  const geminiApiKey = runtime.getSecret({ id: "GEMINI_API_KEY" }).result();
  const httpClient = new cre.capabilities.HTTPClient();

  const calldataSection = proposalData.calldata
    ? `\n\nEXECUTABLE CALLDATA (actual on-chain code):\n${proposalData.calldata}`
    : "\n\n(No calldata provided)";

  const userPrompt = `Analyze this governance proposal for similarities to known historical DeFi governance attacks.
CRITICAL: Compare the DESCRIPTION against the EXECUTABLE CALLDATA. A mismatch between what the description says and what the code does is the #1 indicator of a governance attack (e.g., Build Finance hostile takeover, Beanstalk flash loan attack).

PROPOSAL:
Title: ${proposalData.title}
Protocol: ${proposalData.protocol}
Description: ${proposalData.description}
${calldataSection}

TENDERLY VTN SIMULATION RESULTS:
- Gas Used: ${simResults.gasUsed}
- TVL Change: ${simResults.tvlChangePct}%
- Liquidation Risk: ${simResults.liquidationRisk}/100
- Price Impact: ${simResults.priceImpactPct}%
- Affected Addresses: ${simResults.affectedAddresses}
- Collateral Ratio: ${simResults.collateralRatioBefore}x → ${simResults.collateralRatioAfter}x
- State Changes: ${simResults.stateDiffCount}

HISTORICAL GOVERNANCE ATTACKS DATABASE:
${historicalAttacksContext}

For each historical attack that has ANY similarity to this proposal, output a match entry. Consider:
1. Does the proposal's intent resemble the attack vector?
2. Do the simulation metrics suggest risk?
3. Are there textual/structural similarities?

Respond with this exact JSON:
{
  "matches": [
    {
      "patternId": "attack-id-from-database",
      "name": "Attack Name (Protocol, Date)",
      "similarity": 25,
      "historicalLoss": "$182M",
      "date": "April 2022",
      "description": "Brief explanation of why this matches",
      "indicators": ["indicator 1", "indicator 2"]
    }
  ]
}

RULES:
- similarity: 0-100 percentage. Be precise — don't default to 20%.
  0-15: Very weak, tangential similarity only
  16-35: Moderate, some structural parallels
  36-60: Strong, clear pattern overlap
  61-100: Very strong, near-identical attack vector
- CRITICAL: If the calldata does NOT match the description (e.g., description says "oracle update" but code does "transferOwnership"), similarity to governance attacks should be 70-95%.
- Only include matches with similarity >= 10
- If no matches found, return {"matches": []}
- Keep descriptions to 1 sentence
- Output ONLY valid JSON`;

  const result = httpClient
    .sendRequest(
      runtime,
      buildGeminiRequest(ATTACK_SCAN_SYSTEM, userPrompt, geminiApiKey.value),
      consensusIdenticalAggregation<GeminiCallResult>()
    )(runtime.config)
    .result();

  runtime.log("[Gemini] Attack scan response received, parsing...");

  try {
    let cleanText = result.text;
    const fenceMatch = cleanText.match(/\`\`\`(?:json)?\s*([\s\S]*?)\`\`\`/);
    if (fenceMatch) cleanText = fenceMatch[1];
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const parsed = JSON.parse(jsonMatch[0]) as { matches?: AttackMatch[] };
    const matches = (parsed.matches || []).map((m) => ({
      patternId: m.patternId || "unknown",
      name: m.name || "Unknown pattern",
      similarity: Math.min(100, Math.max(0, m.similarity || 0)),
      historicalLoss: m.historicalLoss || "Unknown",
      date: m.date || "",
      description: m.description || "",
      indicators: m.indicators || [],
    }));
    runtime.log(`[Gemini] Found ${matches.length} attack pattern match(es)`);
    return matches.sort((a, b) => b.similarity - a.similarity);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    runtime.log(`[Gemini] Attack scan parse error: ${msg}`);
    return [];
  }
}
