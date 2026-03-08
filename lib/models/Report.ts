import mongoose, { Schema, Document } from 'mongoose';

export interface ReportDocument extends Document {
  proposalId: string;
  debateId: string;
  simulationId: string;
  contentHash: string;
  onChainTxHash: string;
  onChainReportId: string;
  creForwarderAddress: string;
  blockNumber: number;
  verifiedAt: Date;
  report: {
    title: string;
    protocol: string;
    recommendation: string;
    riskScore: number;
    summary: string;
    agentVotes: Record<string, string>;
    simulationHighlights: Record<string, number>;
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
  pipelineSteps?: Array<{
    id: string;
    label: string;
    status: string;
    durationMs?: number;
    detail?: string;
  }>;
  vtnSimTxUrl?: string;
}

const ReportSchema = new Schema<ReportDocument>(
  {
    proposalId: { type: String, required: true, index: true },
    debateId: { type: String, required: true },
    simulationId: { type: String, required: true },
    contentHash: { type: String, required: true },
    onChainTxHash: { type: String, required: true },
    onChainReportId: { type: String, required: true },
    creForwarderAddress: { type: String, required: true },
    blockNumber: { type: Number, required: true },
    verifiedAt: { type: Date, required: true },
    report: { type: Schema.Types.Mixed, required: true },
    timing: { type: Schema.Types.Mixed, required: false },
    pipelineSteps: { type: Schema.Types.Mixed, required: false },
    vtnSimTxUrl: { type: String, required: false },
  },
  { timestamps: true }
);

export default mongoose.models.Report || mongoose.model<ReportDocument>('Report', ReportSchema);
