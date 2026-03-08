import { IDebateMessage, IVerdict, IAttackMatch, SpeakerId, VoteOption, AGENT_PROFILES, IAgentFinalPosition } from '@/types';
import { streamAgentDebate, SimMetricsForDebate } from '@/lib/gemini-streaming';

export type PipelineStepStatus = 'pending' | 'running' | 'complete' | 'failed';

export interface PipelineStep {
  id: string;
  label: string;
  status: PipelineStepStatus;
  durationMs?: number;
  detail?: string;
  startedAt?: string;
  completedAt?: string;
}

const DEFAULT_PIPELINE_STEPS: () => PipelineStep[] = () => [
  { id: 'proposal_submitted', label: 'Proposal Submitted', status: 'pending' },
  { id: 'tenderly_simulation', label: 'Tenderly VTN Simulation', status: 'pending' },
  { id: 'attack_scan', label: 'Historical Attack Pattern Scan (Gemini)', status: 'pending' },
  { id: 'ai_debate', label: 'AI Senate Debate (Gemini)', status: 'pending' },
  { id: 'senate_verdict', label: 'Senate Verdict Computation', status: 'pending' },
  { id: 'don_report', label: 'DON-Signed Report Generation', status: 'pending' },
  { id: 'onchain_publish', label: 'Publishing to SenateReport.sol', status: 'pending' },
  { id: 'webhook', label: 'Finalizing & Persisting', status: 'pending' },
  { id: 'complete', label: 'Pipeline Complete', status: 'pending' },
];

export interface CREResult {
  proposalId: string;
  title: string;
  protocol: string;
  status: 'running' | 'complete' | 'failed';
  events: CREEvent[];
  verdict?: IVerdict;
  txHash?: string;
  vtnSimTxUrl?: string;
  messages: IDebateMessage[];
  attackMatches: IAttackMatch[];
  receivedAt: string;
  completedAt?: string;
  pipelineSteps: PipelineStep[];
  simMetrics?: SimMetricsForDebate;
  streamingDebateActive?: boolean;
  timing?: {
    simulation?: number;
    attackScan?: number;
    debate?: number;
    report?: number;
    write?: number;
    total?: number;
  };
}

export interface CREEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
  durationMs?: number;
}

type Listener = (proposalId: string, event: CREEvent) => void;

const results = new Map<string, CREResult>();
const streamingAbortControllers = new Map<string, AbortController>();
const listeners: Listener[] = [];

export function addListener(fn: Listener) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

function notify(proposalId: string, event: CREEvent) {
  for (const fn of listeners) {
    try { fn(proposalId, event); } catch {}
  }
}

export function getCREResult(proposalId: string): CREResult | undefined {
  return results.get(proposalId);
}

export function getAllCREResults(): CREResult[] {
  return Array.from(results.values()).sort(
    (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  );
}

export function initPipelineForProposal(proposalId: string, title: string, protocol: string) {
  const timestamp = new Date().toISOString();
  const steps = DEFAULT_PIPELINE_STEPS();
  steps[0].status = 'complete';
  steps[0].completedAt = timestamp;

  const result: CREResult = {
    proposalId,
    title,
    protocol,
    status: 'running',
    events: [],
    messages: [],
    attackMatches: [],
    receivedAt: timestamp,
    pipelineSteps: steps,
  };
  results.set(proposalId, result);
  notify(proposalId, { type: 'step_progress', data: { stepId: 'proposal_submitted', status: 'complete' }, timestamp });
}

const STEP_LOG_MAP: Record<string, { startPattern: string; endPattern: string; stepId: string }> = {
  '1': { startPattern: 'Simulating', endPattern: 'Simulation complete', stepId: 'tenderly_simulation' },
  '2': { startPattern: 'Scanning', endPattern: 'matched', stepId: 'attack_scan' },
  '3': { startPattern: 'Running AI Senate', endPattern: 'Debate complete', stepId: 'ai_debate' },
  '4': { startPattern: 'Verdict', endPattern: 'Verdict', stepId: 'senate_verdict' },
  '5': { startPattern: 'Generating DON', endPattern: 'Report generated', stepId: 'don_report' },
  '6': { startPattern: 'Publishing', endPattern: 'Report published', stepId: 'onchain_publish' },
  '7': { startPattern: 'Notifying', endPattern: 'webhook', stepId: 'webhook' },
};

const AGENT_NAME_MAP: Record<string, { speakerId: SpeakerId; speakerName: string; speakerTitle: string }> = {
  caesar: { speakerId: 'caesar', speakerName: 'Caesar', speakerTitle: 'The Bull' },
  brutus: { speakerId: 'brutus', speakerName: 'Brutus', speakerTitle: 'The Bear' },
  cassius: { speakerId: 'cassius', speakerName: 'Cassius', speakerTitle: 'The Quant' },
  portia: { speakerId: 'portia', speakerName: 'Portia', speakerTitle: 'The Defender' },
};

export function processStepLog(proposalId: string, logLine: string) {
  const result = results.get(proposalId);
  if (!result) return;

  // Capture VTN TX hash from simulation log (e.g. "  VTN TX Hash: 0xabc...")
  const txHashMatch = logLine.match(/VTN TX Hash:\s*(0x[0-9a-fA-F]+)/);
  if (txHashMatch) {
    const txHash = txHashMatch[1];
    const vtnExplorerBase = `https://dashboard.tenderly.co/dilawaridev/cre-hackathon/testnet/793f498b-03f5-4fc8-9df7-c06cef7727ff`;
    result.vtnSimTxUrl = `${vtnExplorerBase}/tx/${txHash}`;
    notify(proposalId, { type: 'vtn_tx_url', data: { url: result.vtnSimTxUrl }, timestamp: new Date().toISOString() });
  }

  // Parse agent vote lines like "  caesar: FAIL (65%)" or "  caesar: FAIL (65%) [CHANGED from PASS]"
  const agentVoteMatch = logLine.match(/^\s{2,}(\w+):\s*(PASS|FAIL|ABSTAIN)\s*\((\d+)%\)(.*)$/);
  if (agentVoteMatch) {
    const agentId = agentVoteMatch[1].toLowerCase();
    const vote = agentVoteMatch[2] as VoteOption;
    const confidence = parseInt(agentVoteMatch[3]);
    const extra = agentVoteMatch[4];
    const agent = AGENT_NAME_MAP[agentId];
    if (agent) {
      const changed = extra.includes('[CHANGED');
      const phase = changed ? 'counter' : 'opening';
      const now = new Date().toISOString();
      const msg: IDebateMessage = {
        id: `live-${agent.speakerId}-${phase}-${Date.now()}`,
        speakerId: agent.speakerId,
        speakerName: agent.speakerName,
        speakerTitle: agent.speakerTitle,
        argument: changed ? `Changed vote to ${vote} (${confidence}% confidence)` : `Votes ${vote} with ${confidence}% confidence`,
        vote,
        phase,
        confidence,
        isChairperson: false,
        timestamp: now,
      };
      result.messages.push(msg);
      notify(proposalId, { type: 'debate_message', data: { ...msg }, timestamp: now });
    }
  }

  // Parse Angel verdict line: "  Angel verdict: FAIL — risk 72/100"
  const angelMatch = logLine.match(/^\s{2,}Angel verdict:\s*(PASS|FAIL)\s*—\s*risk\s*(\d+)\/100/);
  if (angelMatch) {
    const vote = angelMatch[1] as VoteOption;
    const riskScore = parseInt(angelMatch[2]);
    const now = new Date().toISOString();
    const msg: IDebateMessage = {
      id: `live-angel-verdict-${Date.now()}`,
      speakerId: 'angel',
      speakerName: 'Angel',
      speakerTitle: 'The Guardian',
      argument: `Final verdict: ${vote} — Risk score ${riskScore}/100`,
      vote,
      phase: 'verdict',
      confidence: riskScore,
      isChairperson: true,
      timestamp: now,
    };
    result.messages.push(msg);
    notify(proposalId, { type: 'debate_message', data: { ...msg }, timestamp: now });
  }

  const stepMatch = logLine.match(/\[Step (\d+)\/7\]\s*(.*)/);
  if (!stepMatch) {
    if (logLine.includes('Pipeline Complete') || logLine.includes('Pipeline Started')) {
      if (logLine.includes('Started')) {
        updateStep(result, 'proposal_submitted', 'complete');
        notify(proposalId, { type: 'step_progress', data: { stepId: 'proposal_submitted', status: 'complete' }, timestamp: new Date().toISOString() });
      }
    }
    return;
  }

  const stepNum = stepMatch[1];
  const detail = stepMatch[2];
  const mapping = STEP_LOG_MAP[stepNum];
  if (!mapping) return;

  const now = new Date().toISOString();
  const isStart = detail.includes(mapping.startPattern);
  const isEnd = detail.includes(mapping.endPattern) || detail.match(/\(\d+ms\)/);

  const durationMatch = detail.match(/\((\d+)ms\)/);
  const durationMs = durationMatch ? parseInt(durationMatch[1]) : undefined;

  // Parse sim metrics from step 1 completion: "Simulation complete: gas 150000, risk 25 (1997ms)"
  if (stepNum === '1' && isEnd) {
    const gasMatch = detail.match(/gas\s+(\d+)/);
    const riskMatch = detail.match(/risk\s+(\d+)/);
    if (gasMatch || riskMatch) {
      result.simMetrics = {
        gasUsed: gasMatch ? parseInt(gasMatch[1]) : 150000,
        liquidationRisk: riskMatch ? parseInt(riskMatch[1]) : 25,
        tvlChangePct: 0,
      };
    }
  }

  if (isStart && !isEnd) {
    updateStep(result, mapping.stepId, 'running', undefined, detail);
    notify(proposalId, { type: 'step_progress', data: { stepId: mapping.stepId, status: 'running', detail }, timestamp: now });

    // When ai_debate step starts, trigger streaming debate from Next.js server
    if (mapping.stepId === 'ai_debate' && !result.streamingDebateActive) {
      result.streamingDebateActive = true;
      triggerStreamingDebate(proposalId, result).catch((err) => {
        console.error(`[StreamDebate] Error for ${proposalId}:`, err);
      });
    }
  } else if (isEnd || durationMs) {
    updateStep(result, mapping.stepId, 'complete', durationMs, detail);
    notify(proposalId, { type: 'step_progress', data: { stepId: mapping.stepId, status: 'complete', durationMs, detail }, timestamp: now });
  }
}

function updateStep(result: CREResult, stepId: string, status: PipelineStepStatus, durationMs?: number, detail?: string) {
  const step = result.pipelineSteps.find(s => s.id === stepId);
  if (!step) return;
  const now = new Date().toISOString();
  if (status === 'running' && step.status === 'pending') {
    step.status = 'running';
    step.startedAt = now;
  }
  if (status === 'complete') {
    step.status = 'complete';
    step.completedAt = now;
    if (durationMs) step.durationMs = durationMs;
  }
  if (detail) step.detail = detail;
}

async function triggerStreamingDebate(proposalId: string, result: CREResult) {
  console.log(`[StreamDebate] Starting streaming debate for ${proposalId}`);

  const abortController = new AbortController();
  streamingAbortControllers.set(proposalId, abortController);
  const { signal } = abortController;

  const emitMessage = (msg: IDebateMessage) => {
    if (signal.aborted || result.status === 'complete') return;

    const existingIdx = result.messages.findIndex(m => m.id === msg.id);
    if (existingIdx >= 0) {
      result.messages[existingIdx] = msg;
    } else {
      result.messages.push(msg);
    }

    const eventType = msg.streaming ? 'debate_message_chunk' : 'debate_message';
    notify(proposalId, { type: eventType, data: { ...msg }, timestamp: msg.timestamp });
  };

  const proposalText = `${result.title}\n\n(Protocol: ${result.protocol})`;
  const simMetrics: SimMetricsForDebate = result.simMetrics || {
    gasUsed: 150000,
    liquidationRisk: 25,
    tvlChangePct: 0,
  };

  let calldataSection = '';
  let fullProposalText = proposalText;

  try {
    const { connectDB } = await import('@/lib/db');
    const ProposalModel = (await import('@/lib/models/Proposal')).default;
    await connectDB();
    const proposal = await ProposalModel.findOne({ proposalId }).lean();
    if (proposal && (proposal as any).rawCalldata) {
      calldataSection = `\n\nEXECUTABLE CALLDATA:\n${(proposal as any).rawCalldata}`;
    }
    if (proposal) {
      const desc = (proposal as any).description;
      if (desc && desc.length > 20) {
        fullProposalText = `${result.title}\n\n${desc}${calldataSection}`;
      }
    }
  } catch (err) {
    console.error(`[StreamDebate] DB fetch error, using basic context:`, err);
  }

  try {
    await streamAgentDebate(fullProposalText, simMetrics, emitMessage, signal);
    console.log(`[StreamDebate] Streaming debate complete for ${proposalId}`);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.log(`[StreamDebate] Aborted for ${proposalId} (CRE pipeline completed first)`);
    } else {
      console.error(`[StreamDebate] Error for ${proposalId}:`, err);
    }
  } finally {
    streamingAbortControllers.delete(proposalId);
  }
}

function voteNumToStr(v: number): VoteOption {
  if (v === 0) return 'PASS';
  if (v === 1) return 'FAIL';
  return 'ABSTAIN';
}

export function processCREWebhookEvent(type: string, data: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const event: CREEvent = { type, data, timestamp };

  const proposalId = (data.proposalId as string) || 'cre-unknown';

  if (!results.has(proposalId)) {
    results.set(proposalId, {
      proposalId,
      title: (data.title as string) || '',
      protocol: (data.protocol as string) || '',
      status: 'running',
      events: [],
      messages: [],
      attackMatches: [],
      receivedAt: timestamp,
      pipelineSteps: DEFAULT_PIPELINE_STEPS(),
    });
  }

  const result = results.get(proposalId)!;
  
  // Store timing if provided
  const durationMs = data.durationMs as number | undefined;
  if (durationMs) {
    event.durationMs = durationMs;
  }
  
  result.events.push(event);

  switch (type) {
    case 'pipeline_started': {
      result.title = (data.title as string) || result.title;
      result.protocol = (data.protocol as string) || result.protocol;
      result.status = 'running';
      break;
    }

    case 'simulation_complete': {
      const simData = data.simulation as Record<string, unknown> | undefined;
      if (simData) {
        // Store simulation data for later use
        result.events.push({
          type: 'simulation_data',
          data: simData,
          timestamp,
          durationMs,
        });
      }
      break;
    }

    case 'opening_statement':
    case 'counter_argument': {
      const agentId = (data.agentId as string) as SpeakerId;
      const profile = AGENT_PROFILES[agentId] || { name: agentId, title: '' };
      const phase = type === 'opening_statement' ? 'opening' as const : 'counter' as const;
      const changedVote = data.changedVote as boolean | undefined;
      const msg: IDebateMessage = {
        id: `cre-${Date.now()}-${agentId}`,
        phase,
        speakerId: agentId,
        speakerName: profile.name,
        speakerTitle: profile.title,
        isChairperson: false,
        vote: voteNumToStr(data.vote as number),
        confidence: (data.confidence as number) || 80,
        argument: (data.argument as string) || '',
        keyPoints: (data.keyPoints as string[]) || [],
        voteBefore: changedVote ? voteNumToStr(data.voteBefore as number) : undefined,
        voteAfter: changedVote ? voteNumToStr(data.vote as number) : undefined,
        timestamp,
      };
      result.messages.push(msg);
      break;
    }

    case 'chairperson_review': {
      const review = data.review as Record<string, unknown> | undefined;
      if (review) {
        const now = Date.now();
        const reviewMsg: IDebateMessage = {
          id: `cre-${now}-angel-review`,
          phase: 'review',
          speakerId: 'angel',
          speakerName: 'Angel',
          speakerTitle: 'The Guardian',
          isChairperson: true,
          argument: (review.summary as string) || 'Reviewing agent positions...',
          keyPoints: [],
          timestamp,
        };
        result.messages.push(reviewMsg);

        if (review.counterQuestion) {
          const targets = (review.targetAgents as string[]) || [];
          const targetNames = targets.map(t => {
            const p = AGENT_PROFILES[t as SpeakerId];
            return p ? p.name : t;
          }).join(' and ');
          const questionMsg: IDebateMessage = {
            id: `cre-${now}-angel-counter-q`,
            phase: 'review',
            speakerId: 'angel',
            speakerName: 'Angel',
            speakerTitle: 'The Guardian',
            isChairperson: true,
            argument: `📌 To ${targetNames}: ${review.counterQuestion as string}`,
            keyPoints: [],
            counterQuestionTo: targets as SpeakerId[],
            timestamp,
          };
          result.messages.push(questionMsg);
        }
      }
      break;
    }

    case 'chairperson_verdict': {
      const verdictData = data.verdict as Record<string, unknown> | undefined;
      if (verdictData) {
        const msg: IDebateMessage = {
          id: `cre-${Date.now()}-angel-verdict`,
          phase: 'verdict',
          speakerId: 'angel',
          speakerName: 'Angel',
          speakerTitle: 'The Guardian',
          isChairperson: true,
          vote: voteNumToStr(verdictData.recommendation as number),
          argument: (verdictData.summary as string) || '',
          timestamp,
        };
        result.messages.push(msg);

        const agentPositions: IAgentFinalPosition[] = result.messages
          .filter(m => !m.isChairperson && m.vote)
          .reduce((acc, m) => {
            const existing = acc.find(a => a.agentId === m.speakerId);
            if (existing) {
              existing.finalVote = m.vote!;
              existing.finalStance = m.argument;
              existing.confidence = m.confidence || 80;
              if (m.voteBefore) {
                existing.changedVote = true;
                existing.voteBefore = m.voteBefore;
              }
            } else {
              acc.push({
                agentId: m.speakerId,
                name: m.speakerName,
                title: m.speakerTitle,
                finalVote: m.vote!,
                confidence: m.confidence || 80,
                finalStance: m.argument,
                changedVote: !!m.voteBefore,
                voteBefore: m.voteBefore,
              });
            }
            return acc;
          }, [] as IAgentFinalPosition[]);

        const voteBreakdown: Record<string, VoteOption> = {};
        for (const pos of agentPositions) {
          voteBreakdown[pos.agentId] = pos.finalVote;
        }

        result.verdict = {
          recommendation: voteNumToStr(verdictData.recommendation as number),
          riskScore: (verdictData.riskScore as number) || 50,
          summary: (verdictData.summary as string) || '',
          voteBreakdown,
          agentFinalPositions: agentPositions,
          attackMatches: result.attackMatches,
        };
      }
      break;
    }

    case 'report_published': {
      result.txHash = data.txHash as string;
      result.status = 'complete';
      result.completedAt = timestamp;

      // Abort any in-flight streaming debate
      const controller = streamingAbortControllers.get(proposalId);
      if (controller) {
        controller.abort();
        streamingAbortControllers.delete(proposalId);
      }

      // Clear streaming preview messages so official CRE messages take their place
      result.messages = result.messages.filter(m => !m.id.startsWith('stream-'));

      if (data.proposalId) result.proposalId = data.proposalId as string;
      if (data.title) result.title = data.title as string;
      if (data.protocol) result.protocol = data.protocol as string;

      for (const step of result.pipelineSteps) {
        if (step.status !== 'complete') {
          step.status = 'complete';
          step.completedAt = timestamp;
        }
      }

      // Store timing information
      const timing = data.timing as Record<string, number> | undefined;
      if (timing) {
        result.timing = {
          simulation: timing.simulation,
          attackScan: timing.attackScan,
          debate: timing.debate,
          report: timing.report,
          write: timing.write,
          total: timing.total,
        };
      }

      const openingStatements = data.openingStatements as { agentId: string; vote: number; confidence: number; argument: string; keyPoints?: string[] }[] | undefined;
      const agents = data.agents as { agentId: string; vote: number; confidence: number; argument: string; keyPoints?: string[]; changedVote?: boolean; voteBefore?: number }[] | undefined;
      const review = data.review as { hasDispute?: boolean; summary?: string; counterQuestion?: string; targetAgents?: string[] } | undefined;
      const verdictPayload = data.verdict as { recommendation: number; riskScore: number; summary: string } | undefined;
      const attacks = data.attackMatches as IAttackMatch[] | undefined;

      if (attacks && attacks.length > 0) {
        result.attackMatches = attacks;
      }

      // Create opening statements from the dedicated openingStatements array
      if (openingStatements && openingStatements.length > 0 && result.messages.filter(m => m.phase === 'opening').length === 0) {
        const now3 = Date.now();
        
        for (let i = 0; i < openingStatements.length; i++) {
          const a = openingStatements[i];
          const agentId = a.agentId as SpeakerId;
          const profile = AGENT_PROFILES[agentId] || { name: agentId, title: '' };

          result.messages.push({
            id: `cre-${now3}-${i}-${agentId}-open`,
            phase: 'opening',
            speakerId: agentId,
            speakerName: profile.name,
            speakerTitle: profile.title,
            isChairperson: false,
            vote: voteNumToStr(a.vote),
            confidence: a.confidence || 80,
            argument: a.argument || '',
            keyPoints: a.keyPoints || [],
            timestamp,
          });
        }
      }

      // Create counter-argument messages from the dedicated counterArguments array
      const counterArgs = data.counterArguments as { agentId: string; vote: number; confidence: number; argument: string; keyPoints?: string[]; changedVote?: boolean }[] | undefined;
      if (counterArgs && counterArgs.length > 0) {
        const now4 = Date.now();
        for (let i = 0; i < counterArgs.length; i++) {
          const ca = counterArgs[i];
          const agentId = ca.agentId as SpeakerId;
          const profile = AGENT_PROFILES[agentId] || { name: agentId, title: '' };
          const openingMsg = result.messages.find(m => m.speakerId === agentId && m.phase === 'opening');
          const openingVote = openingMsg?.vote;
          const finalVote = voteNumToStr(ca.vote);
          const didChange = ca.changedVote || (openingVote != null && openingVote !== finalVote);
          
          result.messages.push({
            id: `cre-${now4}-${i}-${agentId}-counter`,
            phase: 'counter',
            speakerId: agentId,
            speakerName: profile.name,
            speakerTitle: profile.title,
            isChairperson: false,
            vote: finalVote,
            confidence: ca.confidence || 80,
            argument: ca.argument || '',
            keyPoints: ca.keyPoints || [],
            voteBefore: didChange ? openingVote : undefined,
            voteAfter: didChange ? finalVote : undefined,
            timestamp,
          });
        }
      }

      if (review && result.messages.filter(m => m.isChairperson && m.phase === 'review').length === 0) {
        const now2 = Date.now();
        result.messages.push({
          id: `cre-${now2}-angel-review`,
          phase: 'review',
          speakerId: 'angel',
          speakerName: 'Angel',
          speakerTitle: 'The Guardian',
          isChairperson: true,
          argument: review.summary || 'Reviewing agent positions...',
          keyPoints: [],
          timestamp,
        });

        if (review.counterQuestion) {
          const targets2 = (review.targetAgents as string[]) || [];
          const targetNames2 = targets2.map(t => {
            const p = AGENT_PROFILES[t as SpeakerId];
            return p ? p.name : t;
          }).join(' and ');
          result.messages.push({
            id: `cre-${now2}-angel-counter-q`,
            phase: 'review',
            speakerId: 'angel',
            speakerName: 'Angel',
            speakerTitle: 'The Guardian',
            isChairperson: true,
            argument: `📌 To ${targetNames2}: ${review.counterQuestion}`,
            keyPoints: [],
            counterQuestionTo: targets2 as SpeakerId[],
            timestamp,
          });
        }
      }

      if (verdictPayload) {
        result.messages.push({
          id: `cre-${Date.now()}-angel-verdict`,
          phase: 'verdict',
          speakerId: 'angel',
          speakerName: 'Angel',
          speakerTitle: 'The Guardian',
          isChairperson: true,
          vote: voteNumToStr(verdictPayload.recommendation),
          argument: verdictPayload.summary || '',
          timestamp,
        });

        const agentPositions: IAgentFinalPosition[] = result.messages
          .filter(m => !m.isChairperson && m.vote)
          .reduce((acc, m) => {
            const existing = acc.find(a => a.agentId === m.speakerId);
            if (existing) {
              existing.finalVote = m.vote!;
              existing.finalStance = m.argument;
              existing.confidence = m.confidence || 80;
              if (m.voteBefore) {
                existing.changedVote = true;
                existing.voteBefore = m.voteBefore;
              }
            } else {
              acc.push({
                agentId: m.speakerId,
                name: m.speakerName,
                title: m.speakerTitle,
                finalVote: m.vote!,
                confidence: m.confidence || 80,
                finalStance: m.argument,
                changedVote: !!m.voteBefore,
                voteBefore: m.voteBefore,
              });
            }
            return acc;
          }, [] as IAgentFinalPosition[]);

        const voteBreakdown: Record<string, VoteOption> = {};
        for (const pos of agentPositions) {
          voteBreakdown[pos.agentId] = pos.finalVote;
        }

        result.verdict = {
          recommendation: voteNumToStr(verdictPayload.recommendation),
          riskScore: verdictPayload.riskScore || 50,
          summary: verdictPayload.summary || '',
          voteBreakdown,
          agentFinalPositions: agentPositions,
          attackMatches: result.attackMatches,
        };
      }
      break;
    }

    case 'attack_scan': {
      if (data.attackMatches) {
        result.attackMatches = data.attackMatches as IAttackMatch[];
      }
      break;
    }
  }

  notify(proposalId, event);
}
