import { IDebateMessage, SpeakerId, AGENT_PROFILES, VoteOption } from '@/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export interface SimMetricsForDebate {
  gasUsed: number;
  liquidationRisk: number;
  tvlChangePct: number;
  priceImpactPct?: number;
  affectedAddresses?: number;
  collateralRatioBefore?: number;
  collateralRatioAfter?: number;
  stateDiffCount?: number;
}

interface AgentConfig {
  id: SpeakerId;
  name: string;
  title: string;
  systemPrompt: string;
}

const AGENT_CONFIGS: AgentConfig[] = [
  {
    id: 'caesar',
    name: 'Caesar',
    title: 'The Bull',
    systemPrompt: `You are Caesar "The Bull" — a growth-first DeFi maximalist senator in the SENATE governance analysis system. You are biased toward PASS for proposals that increase yield, TVL, or protocol growth. You analyze governance proposals and give your opening statement.

Respond with ONLY valid JSON:
{"vote": "PASS or FAIL or ABSTAIN", "confidence": 75, "argument": "Your 2-3 sentence opening statement", "keyPoints": ["point1", "point2"]}`,
  },
  {
    id: 'brutus',
    name: 'Brutus',
    title: 'The Bear',
    systemPrompt: `You are Brutus "The Bear" — a risk-first security researcher senator in the SENATE governance analysis system. You are an expert on historical DeFi attacks (Beanstalk $182M flash loan, Tornado Cash malicious proposal, Build Finance hostile DAO takeover, Compound Prop 289 whale manipulation, Mango Markets $114M exploit). You ALWAYS cross-check the description against any calldata. If they don't match, this is a MAJOR red flag.

Respond with ONLY valid JSON:
{"vote": "PASS or FAIL or ABSTAIN", "confidence": 85, "argument": "Your 2-3 sentence opening statement referencing any attack parallels", "keyPoints": ["point1", "point2"]}`,
  },
  {
    id: 'cassius',
    name: 'Cassius',
    title: 'The Quant',
    systemPrompt: `You are Cassius "The Quant" — an emotionless quantitative analyst senator in the SENATE governance analysis system. You only care about EV, probability, sigma events. You verify calldata parameters are mathematically consistent with the description.

Respond with ONLY valid JSON:
{"vote": "PASS or FAIL or ABSTAIN", "confidence": 70, "argument": "Your 2-3 sentence quantitative analysis", "keyPoints": ["point1", "point2"]}`,
  },
  {
    id: 'portia',
    name: 'Portia',
    title: 'The Defender',
    systemPrompt: `You are Portia "The Defender" — a community advocate senator in the SENATE governance analysis system. You consider governance culture, precedent, community health, and whether the proposal follows best practices.

Respond with ONLY valid JSON:
{"vote": "PASS or FAIL or ABSTAIN", "confidence": 60, "argument": "Your 2-3 sentence community-focused analysis", "keyPoints": ["point1", "point2"]}`,
  },
];

const ANGEL_SYSTEM_PROMPT = `You are Angel "The Guardian" — the impartial chairperson of the SENATE governance analysis system. You do NOT vote. You review all senator positions, identify disputes, and deliver a final verdict with risk score.

Given the senators' positions, respond with ONLY valid JSON:
{"summary": "Your 2-3 sentence review", "recommendation": "PASS or FAIL", "riskScore": 65, "counterQuestion": "A targeted question for one senator (or null if no dispute)", "targetAgent": "agent_id or null"}`;

function buildAgentUserPrompt(
  proposalText: string,
  simMetrics: SimMetricsForDebate,
  previousResponses: Array<{ name: string; vote: string; argument: string }>,
): string {
  let context = `GOVERNANCE PROPOSAL:\n${proposalText}\n\nSIMULATION RESULTS:\n- Gas Used: ${simMetrics.gasUsed}\n- Liquidation Risk: ${simMetrics.liquidationRisk}/100\n- TVL Change: ${simMetrics.tvlChangePct}%`;

  if (simMetrics.priceImpactPct != null) context += `\n- Price Impact: ${simMetrics.priceImpactPct}%`;
  if (simMetrics.affectedAddresses != null) context += `\n- Affected Addresses: ${simMetrics.affectedAddresses}`;
  if (simMetrics.collateralRatioBefore != null && simMetrics.collateralRatioAfter != null) {
    context += `\n- Collateral Ratio: ${simMetrics.collateralRatioBefore}x → ${simMetrics.collateralRatioAfter}x`;
  }

  if (previousResponses.length > 0) {
    context += '\n\nPREVIOUS SENATORS\' POSITIONS:';
    for (const r of previousResponses) {
      context += `\n- ${r.name}: ${r.vote} — "${r.argument}"`;
    }
  }

  context += '\n\nGive your opening statement. Output ONLY valid JSON, no markdown fences.';
  return context;
}

function buildAngelUserPrompt(
  proposalText: string,
  simMetrics: SimMetricsForDebate,
  agentResponses: Array<{ name: string; id: string; vote: string; confidence: number; argument: string }>,
): string {
  let context = `GOVERNANCE PROPOSAL:\n${proposalText}\n\nSIMULATION: Gas=${simMetrics.gasUsed}, Risk=${simMetrics.liquidationRisk}/100, TVL=${simMetrics.tvlChangePct}%`;
  context += '\n\nSENATOR POSITIONS:';
  for (const a of agentResponses) {
    context += `\n- ${a.name} (${a.id}): ${a.vote} (${a.confidence}%) — "${a.argument}"`;
  }
  context += '\n\nReview all positions and deliver your verdict. Output ONLY valid JSON, no markdown fences.';
  return context;
}

async function streamGeminiCall(
  systemPrompt: string,
  userPrompt: string,
  onChunk: (text: string) => void,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini streaming error ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (chunk) {
          fullText += chunk;
          onChunk(fullText);
        }
      } catch {
        // partial JSON, skip
      }
    }
  }

  return fullText;
}

function parseAgentResponse(text: string): { vote: VoteOption; confidence: number; argument: string; keyPoints: string[] } {
  try {
    let clean = text;
    const fenceMatch = clean.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) clean = fenceMatch[1];
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    const parsed = JSON.parse(jsonMatch[0]);

    const voteStr = String(parsed.vote || 'ABSTAIN').toUpperCase();
    const vote: VoteOption = voteStr === 'PASS' ? 'PASS' : voteStr === 'FAIL' ? 'FAIL' : 'ABSTAIN';

    return {
      vote,
      confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
      argument: parsed.argument || 'No response.',
      keyPoints: parsed.keyPoints || [],
    };
  } catch {
    return { vote: 'ABSTAIN', confidence: 50, argument: text.slice(0, 200), keyPoints: [] };
  }
}

function parseAngelResponse(text: string): { summary: string; recommendation: VoteOption; riskScore: number; counterQuestion: string | null; targetAgent: string | null } {
  try {
    let clean = text;
    const fenceMatch = clean.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) clean = fenceMatch[1];
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    const parsed = JSON.parse(jsonMatch[0]);

    const recStr = String(parsed.recommendation || 'FAIL').toUpperCase();
    const recommendation: VoteOption = recStr === 'PASS' ? 'PASS' : 'FAIL';

    return {
      summary: parsed.summary || 'Verdict rendered.',
      recommendation,
      riskScore: Math.min(100, Math.max(0, parsed.riskScore || 50)),
      counterQuestion: parsed.counterQuestion || null,
      targetAgent: parsed.targetAgent || null,
    };
  } catch {
    return { summary: text.slice(0, 200), recommendation: 'FAIL', riskScore: 50, counterQuestion: null, targetAgent: null };
  }
}

export type StreamingDebateCallback = (msg: IDebateMessage) => void;

export async function streamAgentDebate(
  proposalText: string,
  simMetrics: SimMetricsForDebate,
  onMessage: StreamingDebateCallback,
): Promise<void> {
  const agentResponses: Array<{ id: string; name: string; vote: string; confidence: number; argument: string }> = [];
  const previousForContext: Array<{ name: string; vote: string; argument: string }> = [];

  // Phase 1: Each senator gives opening statement (streamed one by one)
  for (const agent of AGENT_CONFIGS) {
    const profile = AGENT_PROFILES[agent.id];
    const messageId = `stream-${agent.id}-opening-${Date.now()}`;
    const now = new Date().toISOString();

    // Send initial "typing" message
    onMessage({
      id: messageId,
      phase: 'opening',
      speakerId: agent.id,
      speakerName: profile.name,
      speakerTitle: profile.title,
      isChairperson: false,
      argument: '',
      timestamp: now,
      streaming: true,
    });

    const userPrompt = buildAgentUserPrompt(proposalText, simMetrics, previousForContext);

    let lastEmit = 0;
    const fullText = await streamGeminiCall(agent.systemPrompt, userPrompt, (partialText) => {
      const now2 = Date.now();
      if (now2 - lastEmit < 100) return; // throttle to every 100ms
      lastEmit = now2;

      onMessage({
        id: messageId,
        phase: 'opening',
        speakerId: agent.id,
        speakerName: profile.name,
        speakerTitle: profile.title,
        isChairperson: false,
        argument: partialText,
        timestamp: new Date().toISOString(),
        streaming: true,
      });
    });

    const parsed = parseAgentResponse(fullText);

    // Send final complete message
    onMessage({
      id: messageId,
      phase: 'opening',
      speakerId: agent.id,
      speakerName: profile.name,
      speakerTitle: profile.title,
      isChairperson: false,
      vote: parsed.vote,
      confidence: parsed.confidence,
      argument: parsed.argument,
      keyPoints: parsed.keyPoints,
      timestamp: new Date().toISOString(),
      streaming: false,
    });

    agentResponses.push({
      id: agent.id,
      name: profile.name,
      vote: parsed.vote,
      confidence: parsed.confidence,
      argument: parsed.argument,
    });
    previousForContext.push({ name: profile.name, vote: parsed.vote, argument: parsed.argument });
  }

  // Phase 2: Angel reviews and delivers verdict
  const angelProfile = AGENT_PROFILES.angel;
  const angelMsgId = `stream-angel-verdict-${Date.now()}`;
  const angelNow = new Date().toISOString();

  onMessage({
    id: angelMsgId,
    phase: 'verdict',
    speakerId: 'angel',
    speakerName: angelProfile.name,
    speakerTitle: angelProfile.title,
    isChairperson: true,
    argument: '',
    timestamp: angelNow,
    streaming: true,
  });

  const angelPrompt = buildAngelUserPrompt(proposalText, simMetrics, agentResponses);

  let lastAngelEmit = 0;
  const angelText = await streamGeminiCall(ANGEL_SYSTEM_PROMPT, angelPrompt, (partialText) => {
    const now2 = Date.now();
    if (now2 - lastAngelEmit < 100) return;
    lastAngelEmit = now2;

    onMessage({
      id: angelMsgId,
      phase: 'verdict',
      speakerId: 'angel',
      speakerName: angelProfile.name,
      speakerTitle: angelProfile.title,
      isChairperson: true,
      argument: partialText,
      timestamp: new Date().toISOString(),
      streaming: true,
    });
  });

  const angelParsed = parseAngelResponse(angelText);

  onMessage({
    id: angelMsgId,
    phase: 'verdict',
    speakerId: 'angel',
    speakerName: angelProfile.name,
    speakerTitle: angelProfile.title,
    isChairperson: true,
    vote: angelParsed.recommendation,
    argument: angelParsed.summary,
    timestamp: new Date().toISOString(),
    streaming: false,
  });
}
