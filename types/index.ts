export type ProposalStatus = 'pending' | 'simulating' | 'debating' | 'complete' | 'failed';
export type VoteOption = 'PASS' | 'FAIL' | 'ABSTAIN';
export type AgentId = 'caesar' | 'brutus' | 'cassius' | 'portia';
export type SpeakerId = AgentId | 'angel';
export type AgentStatus = 'idle' | 'thinking' | 'speaking' | 'done';
export type DebatePhase = 'opening' | 'review' | 'counter' | 'verdict';

export interface IProposal {
  id: string;
  proposalId: string;
  protocol: string;
  title: string;
  description: string;
  proposer: string;
  startBlock: number;
  endBlock: number;
  status: ProposalStatus;
  chainId: number;
  contractAddress: string;
  rawCalldata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISimulationMetrics {
  tvlChangePct: number;
  liquidationRisk: number;
  priceImpactPct: number;
  gasUsed: number;
  affectedAddresses: number;
  collateralRatioBefore: number;
  collateralRatioAfter: number;
}

export interface IStateDiffEntry {
  address: string;
  slot: string;
  originalValue: string;
  newValue: string;
}

export interface ISimulation {
  id: string;
  proposalId: string;
  forkId: string;
  forkUrl: string;
  simulationId: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  stateDiff: IStateDiffEntry[];
  metrics: ISimulationMetrics;
  createdAt: string;
}

export interface IDebateMessage {
  id: string;
  phase: DebatePhase;
  speakerId: SpeakerId;
  speakerName: string;
  speakerTitle: string;
  isChairperson: boolean;
  vote?: VoteOption;
  confidence?: number;
  argument: string;
  keyPoints?: string[];
  voteBefore?: VoteOption;
  voteAfter?: VoteOption;
  counterQuestionTo?: SpeakerId[];
  timestamp: string;
}

export interface IAttackMatch {
  patternId: string;
  name: string;
  similarity: number;
  historicalLoss: string;
  date: string;
  description: string;
  indicators: string[];
}

export interface IAgentFinalPosition {
  agentId: SpeakerId;
  name: string;
  title: string;
  finalVote: VoteOption;
  confidence: number;
  finalStance: string;
  changedVote: boolean;
  voteBefore?: VoteOption;
}

export interface IVerdict {
  recommendation: VoteOption;
  voteBreakdown: Record<string, VoteOption>;
  riskScore: number;
  summary: string;
  attackMatches?: IAttackMatch[];
  agentFinalPositions: IAgentFinalPosition[];
}

export interface IDebate {
  id: string;
  proposalId: string;
  simulationId: string;
  status: 'pending' | 'running' | 'complete';
  messages: IDebateMessage[];
  verdict: IVerdict | null;
  createdAt: string;
  completedAt: string | null;
}

// Legacy compat — map old `rounds` to `messages` in API consumers
export type IDebateRound = IDebateMessage;

export interface ISenateReport {
  id: string;
  proposalId: string;
  debateId: string;
  simulationId: string;
  contentHash: string;
  onChainTxHash: string;
  onChainReportId: string;
  creForwarderAddress: string;
  blockNumber: number;
  verifiedAt: string;
  report: {
    title: string;
    protocol: string;
    recommendation: VoteOption;
    riskScore: number;
    summary: string;
    agentVotes: Record<string, VoteOption>;
    simulationHighlights: ISimulationMetrics;
    fullDebateHash: string;
  };
  timing?: {
    simulation?: number;
    attackScan?: number;
    debate?: number;
    report?: number;
    write?: number;
    total?: number;
  };
}

export interface AgentProfile {
  id: SpeakerId;
  name: string;
  title: string;
  persona: string;
  catchphrase: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const AGENT_PROFILES: Record<SpeakerId, AgentProfile> = {
  angel: {
    id: 'angel',
    name: 'Angel',
    title: 'The Guardian',
    persona: 'Impartial chairperson and final arbiter',
    catchphrase: 'Let wisdom weigh what passion cannot.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/40',
    borderColor: 'border-amber-500',
  },
  caesar: {
    id: 'caesar',
    name: 'Caesar',
    title: 'The Bull',
    persona: 'Growth-first DeFi maximalist',
    catchphrase: 'Capital flows to yield. This is yield.',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/40',
    borderColor: 'border-orange-500',
  },
  brutus: {
    id: 'brutus',
    name: 'Brutus',
    title: 'The Bear',
    persona: 'Risk-first security researcher',
    catchphrase: 'I have seen this exact parameter change before. It ended in a $200M hack.',
    color: 'text-red-400',
    bgColor: 'bg-red-900/40',
    borderColor: 'border-red-500',
  },
  cassius: {
    id: 'cassius',
    name: 'Cassius',
    title: 'The Quant',
    persona: 'Emotionless quantitative analyst',
    catchphrase: 'The simulation shows a 3.2 sigma event with 11% probability. Adjust accordingly.',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-900/40',
    borderColor: 'border-cyan-500',
  },
  portia: {
    id: 'portia',
    name: 'Portia',
    title: 'The Defender',
    persona: 'Protocol community advocate',
    catchphrase: 'A protocol is only as strong as its governance culture.',
    color: 'text-violet-400',
    bgColor: 'bg-violet-900/40',
    borderColor: 'border-violet-500',
  },
};

export const DEBATE_AGENTS: AgentId[] = ['caesar', 'brutus', 'cassius', 'portia'];

export function normalizeSpeakerId(id: string): SpeakerId {
  if (id === 'solomon') return 'angel';
  return id as SpeakerId;
}

export function getAgentProfile(id: string): AgentProfile | undefined {
  return AGENT_PROFILES[normalizeSpeakerId(id)];
}

export function getDisplayName(id: string, fallbackName?: string): string {
  const profile = getAgentProfile(id);
  if (profile) return profile.name;
  if (id === 'solomon' || id === 'Solomon') return 'Angel';
  return fallbackName || id;
}

export function getDisplayTitle(id: string, fallbackTitle?: string): string {
  const profile = getAgentProfile(id);
  if (profile) return profile.title;
  if (id === 'solomon' || id === 'Solomon') return 'The Guardian';
  return fallbackTitle || '';
}

export type SSEEventType =
  | 'pipeline_step'
  | 'simulation_complete'
  | 'attack_scan_complete'
  | 'opening_statement'
  | 'chairperson_review'
  | 'counter_question'
  | 'counter_argument'
  | 'vote_changed'
  | 'chairperson_verdict'
  | 'debate_complete'
  | 'report_published'
  | 'pipeline_complete'
  | 'risk_staleness_alert'
  | 'error';

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp: string;
}
