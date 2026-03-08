import { GoogleGenAI } from '@google/genai';
import config from './config';
import {
  AgentId,
  SpeakerId,
  IDebateMessage,
  IDebate,
  IVerdict,
  IAttackMatch,
  ISimulationMetrics,
  IAgentFinalPosition,
  VoteOption,
  AGENT_PROFILES,
  DEBATE_AGENTS,
} from '@/types';

let genai: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genai) {
    genai = new GoogleGenAI({ apiKey: config.llm.apiKey });
  }
  return genai;
}

// ── System Prompts ───────────────────────────────────────────────────────

const AGENT_SYSTEM_PROMPTS: Record<SpeakerId, string> = {
  angel: `You are Angel "The Guardian", the impartial chairperson of the SENATE governance analysis protocol. You do NOT vote. Your role is to:
1. Identify areas of disagreement between the four senator agents
2. Pose targeted counter-questions when there is a dispute
3. Deliver the final verdict based on all arguments presented
You are calm, fair, and authoritative. You weigh all perspectives equally. Your catchphrase: "Let wisdom weigh what passion cannot."`,

  caesar: `You are Caesar "The Bull", a growth-first DeFi maximalist senator in the SENATE governance analysis protocol. You believe in capital efficiency, yield optimization, and aggressive protocol expansion. You evaluate governance proposals with a strong bias toward growth while acknowledging risks honestly. Your analysis style is confident and decisive. Your catchphrase: "Capital flows to yield. This is yield."`,

  brutus: `You are Brutus "The Bear", a risk-first security researcher senator in the SENATE governance analysis protocol. You scrutinize every proposal for attack vectors, systemic risks, cascading failures, and historical parallels to past DeFi exploits. You have deep knowledge of historical DeFi governance attacks including Beanstalk ($182M flash loan attack), Tornado Cash (malicious lookalike proposal), Build Finance (hostile DAO takeover), Compound Proposal 289 (whale vote manipulation), Mango Markets ($114M exploit), Synthetify (proposal spam), and Steem (exchange custody vote capture). If a proposal resembles ANY of these, you MUST reference the historical precedent. Your catchphrase: "I have seen this exact parameter change before. It ended in a $200M hack."`,

  cassius: `You are Cassius "The Quant", an emotionless quantitative analyst senator in the SENATE governance analysis protocol. You rely exclusively on expected value calculations, probability distributions, sigma events, and risk-adjusted returns. No emotion, only numbers. Your catchphrase: "The simulation shows a 3.2 sigma event with 11% probability. Adjust accordingly."`,

  portia: `You are Portia "The Defender", a protocol community advocate senator in the SENATE governance analysis protocol. You consider governance culture, community sentiment, long-term protocol health, and the precedents a proposal sets. You advocate for safeguards and inclusive governance. Your catchphrase: "A protocol is only as strong as its governance culture."`,
};

// ── Prompt Builders ──────────────────────────────────────────────────────

function buildOpeningPrompt(
  proposalTitle: string,
  proposalDescription: string,
  protocol: string,
  metrics: ISimulationMetrics,
  attackMatches?: IAttackMatch[]
): string {
  let prompt = `Analyze this DeFi governance proposal:

## Proposal
**Protocol:** ${protocol}
**Title:** ${proposalTitle}
**Description:** ${proposalDescription}

## Tenderly Simulation Results
- TVL Change: ${metrics.tvlChangePct > 0 ? '+' : ''}${metrics.tvlChangePct}%
- Liquidation Risk Score: ${metrics.liquidationRisk}/100
- Price Impact: ${metrics.priceImpactPct}%
- Gas Used: ${metrics.gasUsed.toLocaleString()}
- Affected Addresses: ${metrics.affectedAddresses.toLocaleString()}
- Collateral Ratio: ${metrics.collateralRatioBefore}x → ${metrics.collateralRatioAfter}x`;

  if (attackMatches && attackMatches.length > 0) {
    prompt += '\n\n## ATTACK PATTERN ALERTS\nHistorical governance attacks with similarity to this proposal:';
    for (const match of attackMatches) {
      prompt += `\n\n### ${match.name}
- **Historical Loss:** ${match.historicalLoss}
- **Similarity Score:** ${match.similarity}%
- **What happened:** ${match.description}
- **Matching indicators:** ${match.indicators.join(', ')}`;
    }
    prompt += '\n\nYou MUST address these attack pattern similarities. Explain why this IS or IS NOT similar.';
  }

  prompt += `

Give your opening statement. Respond in this EXACT JSON format (no markdown, raw JSON only):
{
  "vote": "PASS" or "FAIL" or "ABSTAIN",
  "confidence": 0-100,
  "argument": "Your detailed analysis in 2-3 paragraphs. Be specific, cite simulation numbers.",
  "keyPoints": ["key point 1", "key point 2", "key point 3"]
}`;

  return prompt;
}

function buildChairpersonReviewPrompt(openingStatements: IDebateMessage[]): string {
  let prompt = `You are chairing a governance debate. The four senators have given their opening statements:\n`;

  for (const msg of openingStatements) {
    prompt += `\n### ${msg.speakerName} (${msg.speakerTitle}) — voted ${msg.vote} (${msg.confidence}% confidence):
${msg.argument}\n`;
  }

  const votes = openingStatements.map((m) => m.vote);
  const hasDispute = new Set(votes.filter((v) => v !== 'ABSTAIN')).size > 1;

  if (!hasDispute) {
    prompt += `\nAll senators agree. No counter-questions needed. Respond in JSON:
{
  "hasDispute": false,
  "summary": "Brief summary of consensus and why all agree"
}`;
  } else {
    prompt += `\nThere is disagreement. Identify the core dispute and pose ONE targeted counter-question to the two most opposed senators to resolve it. Keep the question SHORT and specific. Respond in JSON:
{
  "hasDispute": true,
  "disputeSummary": "One sentence describing the core disagreement",
  "counterQuestion": "Your specific question to the disputing agents",
  "targetAgents": ["agentId1", "agentId2"]
}`;
  }

  return prompt;
}

function buildCounterArgumentPrompt(
  originalStatement: IDebateMessage,
  counterQuestion: string,
  otherAgentStatement: IDebateMessage
): string {
  return `The chairperson Angel has posed this question to you and ${otherAgentStatement.speakerName}:

"${counterQuestion}"

${otherAgentStatement.speakerName}'s position: ${otherAgentStatement.argument}

Your original position was: ${originalStatement.vote} (${originalStatement.confidence}% confidence)
Your original argument: ${originalStatement.argument}

Respond to Angel's question. You may change your vote if convinced, or hold firm. Be concise (1 paragraph). Respond in JSON:
{
  "vote": "PASS" or "FAIL" or "ABSTAIN",
  "confidence": 0-100,
  "argument": "Your response to the counter-question (1 paragraph)",
  "changedVote": true or false
}`;
}

function buildFinalVerdictPrompt(
  allMessages: IDebateMessage[],
  attackMatches?: IAttackMatch[]
): string {
  let prompt = `You have chaired this governance debate. Here is the full transcript:\n`;

  for (const msg of allMessages) {
    if (msg.isChairperson && msg.phase === 'review') continue;
    const label = msg.isChairperson ? '[CHAIRPERSON]' : `[${msg.speakerName} — ${msg.vote}]`;
    prompt += `\n${label}: ${msg.argument}\n`;
  }

  if (attackMatches && attackMatches.length > 0) {
    prompt += `\nATTACK PATTERNS DETECTED: ${attackMatches.map((m) => m.name).join(', ')}`;
  }

  prompt += `\n\nDeliver your final verdict. Summarize the debate, note any agents who changed their position, and give your recommendation. Respond in JSON:
{
  "recommendation": "PASS" or "FAIL",
  "riskScore": 0-100,
  "summary": "2-3 sentence verdict summary citing key arguments from the debate"
}`;

  return prompt;
}

// ── LLM Call ─────────────────────────────────────────────────────────────

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  if (config.flags.useMockLLM) {
    return '';
  }

  const ai = getGenAI();
  const response = await ai.models.generateContent({
    model: config.llm.model,
    contents: `${systemPrompt}\n\n${userPrompt}`,
    config: {
      maxOutputTokens: 1024,
      temperature: 0.7,
    },
  });

  return response.text || '';
}

function parseJSON<T>(raw: string, fallback: T): T {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return fallback;
  }
}

// ── Mock Responses ───────────────────────────────────────────────────────

const MOCK_OPENINGS: Record<AgentId, (protocol: string) => {
  vote: VoteOption; confidence: number; argument: string; keyPoints: string[];
}> = {
  caesar: (protocol) => ({
    vote: 'PASS',
    confidence: 85,
    argument: `This ${protocol} proposal represents exactly the kind of capital-efficient expansion the protocol needs. The simulation shows a positive TVL trajectory and manageable risk parameters. In a competitive DeFi landscape, protocols that don't expand their collateral base get left behind. Capital flows to yield. This is yield.`,
    keyPoints: ['Positive TVL growth trajectory', 'Competitive necessity', 'Manageable risk parameters'],
  }),
  brutus: (protocol) => ({
    vote: 'FAIL',
    confidence: 72,
    argument: `I have seen this exact parameter change before. The simulation shows affected addresses in the hundreds — these are real positions that face liquidation risk. The collateral ratio degradation, while seemingly minor, compounds during market stress. We must consider the tail risk that no simulation can capture: a correlated market crash combined with oracle delays.`,
    keyPoints: ['Historical exploit parallels', 'Liquidation cascade risk', 'Tail risk not captured by simulation'],
  }),
  cassius: (protocol) => ({
    vote: 'PASS',
    confidence: 78,
    argument: `Expected value calculation favors approval. Using a conservative 2% annual probability of adverse event and estimated protocol revenue uplift, the risk-adjusted return is positive. The simulation's liquidation risk translates to approximately a 0.7 sigma event — well within the first standard deviation. The numbers support proceeding with appropriate monitoring.`,
    keyPoints: ['Positive expected value calculation', 'Sub-1 sigma liquidation risk', 'Risk-adjusted return favorable'],
  }),
  portia: (protocol) => ({
    vote: 'PASS',
    confidence: 68,
    argument: `From a governance perspective, this proposal strengthens ${protocol}'s position while responding to longstanding community requests. However, I strongly advocate for simultaneous implementation of monitoring safeguards and emergency pause capabilities. A protocol is only as strong as its governance culture — and that culture must include prudent risk management alongside growth.`,
    keyPoints: ['Community alignment', 'Need monitoring safeguards', 'Governance credibility strengthened'],
  }),
};

const MOCK_CHAIRPERSON_REVIEW = {
  hasDispute: true,
  disputeSummary: 'Caesar and Cassius favor growth while Brutus flags significant security risk.',
  counterQuestion: 'Brutus raises valid concerns about tail risk and liquidation cascades. Caesar, can you specifically address how the protocol would handle a correlated market crash with these new parameters? And Brutus, given the simulation shows liquidation risk at only 34/100, what probability do you assign to the tail event you describe?',
  targetAgents: ['caesar', 'brutus'] as SpeakerId[],
};

const MOCK_COUNTER: Record<string, { vote: VoteOption; confidence: number; argument: string; changedVote: boolean }> = {
  caesar: {
    vote: 'PASS',
    confidence: 80,
    argument: 'Angel raises a fair point. In a correlated crash, the 70% LTV does leave buffer — the liquidation threshold at 75% gives a 5% cushion. Combined with Chainlink price feeds and the existing liquidation bot ecosystem, I maintain my PASS but acknowledge the need for the monitoring Portia recommends.',
    changedVote: false,
  },
  brutus: {
    vote: 'FAIL',
    confidence: 65,
    argument: 'The 34/100 liquidation risk is a point-in-time metric. My concern is the conditional probability: given a market crash exceeding 20% in 24 hours (which has occurred 3 times in the past 2 years), the liquidation risk jumps to approximately 72/100. I maintain my FAIL but concede the probability is lower than I initially implied.',
    changedVote: false,
  },
};

const MOCK_VERDICT = {
  recommendation: 'PASS' as VoteOption,
  riskScore: 38,
  summary: 'The Senate recommends PASS with a risk score of 38/100. While Brutus raises legitimate concerns about tail risk in correlated market crashes, the quantitative analysis shows positive expected value and the 70% LTV provides adequate buffer. The recommendation is contingent on implementing the monitoring safeguards Portia advocates.',
};

// ── Debate Flow ──────────────────────────────────────────────────────────

function makeMessage(
  phase: IDebateMessage['phase'],
  speakerId: SpeakerId,
  argument: string,
  opts: Partial<IDebateMessage> = {}
): IDebateMessage {
  const profile = AGENT_PROFILES[speakerId];
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    phase,
    speakerId,
    speakerName: profile.name,
    speakerTitle: profile.title,
    isChairperson: speakerId === 'angel',
    argument,
    timestamp: new Date().toISOString(),
    ...opts,
  };
}

async function runOpeningStatements(
  proposalTitle: string,
  proposalDescription: string,
  protocol: string,
  metrics: ISimulationMetrics,
  attackMatches?: IAttackMatch[],
  onMessage?: (msg: IDebateMessage) => void
): Promise<IDebateMessage[]> {
  const messages: IDebateMessage[] = [];
  const userPrompt = buildOpeningPrompt(proposalTitle, proposalDescription, protocol, metrics, attackMatches);

  for (const agentId of DEBATE_AGENTS) {
    let result: { vote: VoteOption; confidence: number; argument: string; keyPoints: string[] };

    if (config.flags.useMockLLM) {
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));
      result = MOCK_OPENINGS[agentId](protocol);
    } else {
      const raw = await callLLM(AGENT_SYSTEM_PROMPTS[agentId], userPrompt);
      result = parseJSON(raw, {
        vote: 'ABSTAIN' as VoteOption,
        confidence: 50,
        argument: raw,
        keyPoints: [],
      });
      if (!['PASS', 'FAIL', 'ABSTAIN'].includes(result.vote)) result.vote = 'ABSTAIN';
      result.confidence = Math.max(0, Math.min(100, result.confidence));
    }

    const msg = makeMessage('opening', agentId, result.argument, {
      vote: result.vote,
      confidence: result.confidence,
      keyPoints: result.keyPoints,
    });
    messages.push(msg);
    onMessage?.(msg);
  }

  return messages;
}

async function runChairpersonReview(
  openingStatements: IDebateMessage[],
  onMessage?: (msg: IDebateMessage) => void
): Promise<{
  reviewMessage: IDebateMessage;
  hasDispute: boolean;
  counterQuestion?: string;
  targetAgents?: SpeakerId[];
}> {
  let review: {
    hasDispute: boolean;
    summary?: string;
    disputeSummary?: string;
    counterQuestion?: string;
    targetAgents?: SpeakerId[];
  };

  if (config.flags.useMockLLM) {
    await new Promise((r) => setTimeout(r, 500));
    const votes = openingStatements.map((m) => m.vote);
    const uniqueVotes = new Set(votes.filter((v) => v !== 'ABSTAIN'));
    if (uniqueVotes.size <= 1) {
      review = { hasDispute: false, summary: 'All senators are in agreement. No further deliberation needed.' };
    } else {
      review = MOCK_CHAIRPERSON_REVIEW;
    }
  } else {
    const raw = await callLLM(
      AGENT_SYSTEM_PROMPTS.angel,
      buildChairpersonReviewPrompt(openingStatements)
    );
    review = parseJSON(raw, { hasDispute: false, summary: 'Review complete.' });
  }

  const argument = review.hasDispute
    ? `${review.disputeSummary}\n\n${review.counterQuestion}`
    : review.summary || 'The senators are unanimous. No further deliberation needed.';

  const msg = makeMessage('review', 'angel', argument, {
    counterQuestionTo: review.targetAgents,
  });
  onMessage?.(msg);

  return {
    reviewMessage: msg,
    hasDispute: review.hasDispute,
    counterQuestion: review.counterQuestion,
    targetAgents: review.targetAgents,
  };
}

async function runCounterArguments(
  openingStatements: IDebateMessage[],
  counterQuestion: string,
  targetAgents: SpeakerId[],
  onMessage?: (msg: IDebateMessage) => void
): Promise<IDebateMessage[]> {
  const messages: IDebateMessage[] = [];

  const targetOpenings = openingStatements.filter((m) =>
    targetAgents.includes(m.speakerId)
  );

  for (let i = 0; i < targetOpenings.length; i++) {
    const agent = targetOpenings[i];
    const otherAgent = targetOpenings[1 - i] || targetOpenings[0];
    const agentId = agent.speakerId as AgentId;

    let result: { vote: VoteOption; confidence: number; argument: string; changedVote: boolean };

    if (config.flags.useMockLLM) {
      await new Promise((r) => setTimeout(r, 500));
      result = MOCK_COUNTER[agentId] || {
        vote: agent.vote || 'ABSTAIN',
        confidence: agent.confidence || 50,
        argument: 'I maintain my position.',
        changedVote: false,
      };
    } else {
      const raw = await callLLM(
        AGENT_SYSTEM_PROMPTS[agentId],
        buildCounterArgumentPrompt(agent, counterQuestion, otherAgent)
      );
      result = parseJSON(raw, {
        vote: agent.vote || 'ABSTAIN',
        confidence: agent.confidence || 50,
        argument: raw,
        changedVote: false,
      });
    }

    const msg = makeMessage('counter', agentId, result.argument, {
      vote: result.vote,
      confidence: result.confidence,
      voteBefore: result.changedVote ? agent.vote : undefined,
      voteAfter: result.changedVote ? result.vote : undefined,
    });
    messages.push(msg);
    onMessage?.(msg);
  }

  return messages;
}

async function runChairpersonVerdict(
  allMessages: IDebateMessage[],
  attackMatches?: IAttackMatch[],
  onMessage?: (msg: IDebateMessage) => void
): Promise<{ verdictMessage: IDebateMessage; recommendation: VoteOption; riskScore: number; summary: string }> {
  let result: { recommendation: VoteOption; riskScore: number; summary: string };

  if (config.flags.useMockLLM) {
    await new Promise((r) => setTimeout(r, 600));
    result = MOCK_VERDICT;
  } else {
    const raw = await callLLM(
      AGENT_SYSTEM_PROMPTS.angel,
      buildFinalVerdictPrompt(allMessages, attackMatches)
    );
    result = parseJSON(raw, {
      recommendation: 'FAIL' as VoteOption,
      riskScore: 50,
      summary: 'Verdict rendered based on debate.',
    });
  }

  const msg = makeMessage('verdict', 'angel', result.summary, {
    vote: result.recommendation,
  });
  onMessage?.(msg);

  return { verdictMessage: msg, ...result };
}

function buildVerdict(
  allMessages: IDebateMessage[],
  angelResult: { recommendation: VoteOption; riskScore: number; summary: string },
  attackMatches?: IAttackMatch[]
): IVerdict {
  const finalVotes: Record<string, VoteOption> = {};
  const agentFinalPositions: IAgentFinalPosition[] = [];

  for (const agentId of DEBATE_AGENTS) {
    const counterMsg = allMessages.find((m) => m.phase === 'counter' && m.speakerId === agentId);
    const openingMsg = allMessages.find((m) => m.phase === 'opening' && m.speakerId === agentId);
    const finalMsg = counterMsg || openingMsg;

    if (finalMsg) {
      const profile = AGENT_PROFILES[agentId];
      finalVotes[agentId] = finalMsg.vote || 'ABSTAIN';
      const changedVote = counterMsg?.voteBefore !== undefined;

      agentFinalPositions.push({
        agentId,
        name: profile.name,
        title: profile.title,
        finalVote: finalMsg.vote || 'ABSTAIN',
        confidence: finalMsg.confidence || 50,
        finalStance: finalMsg.argument,
        changedVote,
        voteBefore: changedVote ? counterMsg!.voteBefore : undefined,
      });
    }
  }

  return {
    recommendation: angelResult.recommendation,
    voteBreakdown: finalVotes,
    riskScore: angelResult.riskScore,
    summary: angelResult.summary,
    attackMatches,
    agentFinalPositions,
  };
}

// ── Full Debate Orchestrator ─────────────────────────────────────────────

async function runFullDebate(params: {
  proposalId: string;
  simulationId: string;
  proposalTitle: string;
  proposalDescription: string;
  protocol: string;
  metrics: ISimulationMetrics;
  attackMatches?: IAttackMatch[];
  onMessage?: (msg: IDebateMessage) => void;
}): Promise<IDebate> {
  const allMessages: IDebateMessage[] = [];
  const startTime = new Date().toISOString();

  // Phase 1: Opening Statements (4 agents)
  const openings = await runOpeningStatements(
    params.proposalTitle,
    params.proposalDescription,
    params.protocol,
    params.metrics,
    params.attackMatches,
    params.onMessage
  );
  allMessages.push(...openings);

  // Phase 2: Chairperson Review
  const review = await runChairpersonReview(openings, params.onMessage);
  allMessages.push(review.reviewMessage);

  // Phase 3: Counter-Arguments (only if dispute)
  if (review.hasDispute && review.counterQuestion && review.targetAgents) {
    const counters = await runCounterArguments(
      openings,
      review.counterQuestion,
      review.targetAgents,
      params.onMessage
    );
    allMessages.push(...counters);
  }

  // Phase 4: Chairperson Final Verdict
  const verdictResult = await runChairpersonVerdict(
    allMessages,
    params.attackMatches,
    params.onMessage
  );
  allMessages.push(verdictResult.verdictMessage);

  const verdict = buildVerdict(allMessages, verdictResult, params.attackMatches);

  return {
    id: `debate-${Date.now()}`,
    proposalId: params.proposalId,
    simulationId: params.simulationId,
    status: 'complete',
    messages: allMessages,
    verdict,
    createdAt: startTime,
    completedAt: new Date().toISOString(),
  };
}

// ── Legacy compat: computeVerdict from flat rounds ───────────────────────

function computeVerdict(rounds: IDebateMessage[]): IVerdict {
  const votes: Record<string, VoteOption> = {};
  let passWeight = 0;
  let failWeight = 0;
  let totalConfidence = 0;

  for (const round of rounds) {
    if (round.isChairperson) continue;
    votes[round.speakerId] = round.vote || 'ABSTAIN';
    totalConfidence += round.confidence || 0;
    if (round.vote === 'PASS') passWeight += round.confidence || 0;
    if (round.vote === 'FAIL') failWeight += round.confidence || 0;
  }

  const recommendation: VoteOption = passWeight >= failWeight ? 'PASS' : 'FAIL';
  const riskScore = Math.min(100, Math.round(
    (failWeight / Math.max(totalConfidence, 1)) * 100
  ));

  return {
    recommendation,
    voteBreakdown: votes,
    riskScore,
    summary: `Senate recommends ${recommendation} with risk score ${riskScore}/100.`,
    agentFinalPositions: [],
  };
}

const geminiService = {
  runFullDebate,
  runOpeningStatements,
  runChairpersonReview,
  runCounterArguments,
  runChairpersonVerdict,
  computeVerdict,
  callLLM,
};

export default geminiService;
