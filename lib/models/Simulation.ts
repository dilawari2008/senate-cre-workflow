import mongoose, { Schema, Document } from 'mongoose';

export interface SimulationDocument extends Document {
  proposalId: string;
  forkId: string;
  forkUrl: string;
  simulationId: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  stateDiff: { address: string; slot: string; originalValue: string; newValue: string }[];
  metrics: {
    tvlChangePct: number;
    liquidationRisk: number;
    priceImpactPct: number;
    gasUsed: number;
    affectedAddresses: number;
    collateralRatioBefore: number;
    collateralRatioAfter: number;
  };
}

const SimulationSchema = new Schema<SimulationDocument>(
  {
    proposalId: { type: String, required: true, index: true },
    forkId: { type: String, required: true },
    forkUrl: { type: String, required: true },
    simulationId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'running', 'complete', 'failed'], default: 'pending' },
    stateDiff: [{ address: String, slot: String, originalValue: String, newValue: String }],
    metrics: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: 'createdAt' } }
);

export default mongoose.models.Simulation || mongoose.model<SimulationDocument>('Simulation', SimulationSchema);
