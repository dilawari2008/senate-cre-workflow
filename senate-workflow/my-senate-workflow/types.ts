export type SenateConfig = {
  tenderlyAccount: string;
  tenderlyProject: string;
  geminiModel: string;
  webhookUrl: string;
  senateGovernorAddress: string;
  senateRiskOracleAddress: string;
  riskStaleThresholdSeconds: number;
  vtnRpcUrl: string;
  evms: Array<{
    chainSelectorName: string;
    senateReportAddress: string;
    gasLimit: string;
  }>;
};

export type AgentId = "caesar" | "brutus" | "cassius" | "portia";
export type SpeakerId = AgentId | "angel";

export type AgentResult = {
  agentId: string;
  vote: number; // 0=PASS, 1=FAIL, 2=ABSTAIN
  confidence: number;
  argument: string;
  keyPoints: string[];
  changedVote?: boolean;
  voteBefore?: number;
};

export type ChairpersonReview = {
  hasDispute: boolean;
  summary?: string;
  disputeSummary?: string;
  counterQuestion?: string;
  targetAgents?: AgentId[];
};

export type ChairpersonVerdict = {
  recommendation: number; // 0=PASS, 1=FAIL
  riskScore: number;
  summary: string;
};

export type SimulationResult = {
  forkId: string;
  tvlChangePct: number;
  liquidationRisk: number;
  priceImpactPct: number;
  gasUsed: number;
  affectedAddresses: number;
  collateralRatioBefore: number;
  collateralRatioAfter: number;
  stateDiffCount: number;
};

export type AttackMatch = {
  patternId: string;
  name: string;
  similarity: number;
  historicalLoss: string;
  date: string;
  description: string;
  indicators: string[];
};

export type SimulationTxConfig = {
  from: string;
  to: string;
  action: string;
  params: string[];
  description: string;
};

export type ProposalData = {
  id?: string;
  proposalId?: string;
  title: string;
  protocol: string;
  description: string;
  proposer?: string;
  contractAddress?: string;
  rawCalldata?: string;
  calldata?: string;
  simulationTx?: SimulationTxConfig;
};

export type SenateVerdict = {
  recommendation: number;
  riskScore: number;
  votes: Record<string, number>;
  summary: string;
  attackMatches: AttackMatch[];
};

export type SenateResult = {
  txHash: string;
  verdict: SenateVerdict;
};
