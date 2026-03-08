import mongoose, { Schema, Document } from 'mongoose';

const DebateMessageSchema = new Schema(
  {
    phase: { type: String, enum: ['opening', 'review', 'counter', 'verdict'], required: true },
    speakerId: { type: String, required: true },
    speakerName: { type: String, required: true },
    speakerTitle: { type: String, required: true },
    isChairperson: { type: Boolean, default: false },
    vote: { type: String, enum: ['PASS', 'FAIL', 'ABSTAIN'] },
    confidence: { type: Number },
    argument: { type: String, required: true },
    keyPoints: [{ type: String }],
    voteBefore: { type: String, enum: ['PASS', 'FAIL', 'ABSTAIN'] },
    voteAfter: { type: String, enum: ['PASS', 'FAIL', 'ABSTAIN'] },
    counterQuestionTo: [{ type: String }],
  },
  { _id: true, timestamps: true }
);

const AgentFinalPositionSchema = new Schema({
  agentId: { type: String, required: true },
  name: { type: String, required: true },
  title: { type: String, required: true },
  finalVote: { type: String, enum: ['PASS', 'FAIL', 'ABSTAIN'], required: true },
  confidence: { type: Number, required: true },
  finalStance: { type: String, required: true },
  changedVote: { type: Boolean, default: false },
  voteBefore: { type: String, enum: ['PASS', 'FAIL', 'ABSTAIN'] },
});

const VerdictSchema = new Schema({
  recommendation: { type: String, enum: ['PASS', 'FAIL', 'ABSTAIN'], required: true },
  voteBreakdown: { type: Schema.Types.Mixed, required: true },
  riskScore: { type: Number, required: true },
  summary: { type: String, required: true },
  attackMatches: [{ type: Schema.Types.Mixed }],
  agentFinalPositions: [AgentFinalPositionSchema],
});

export interface DebateDocument extends Document {
  proposalId: string;
  simulationId: string;
  status: 'pending' | 'running' | 'complete';
  messages: typeof DebateMessageSchema[];
  verdict: typeof VerdictSchema | null;
  completedAt: Date | null;
}

const DebateSchema = new Schema<DebateDocument>(
  {
    proposalId: { type: String, required: true, index: true },
    simulationId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'running', 'complete'], default: 'pending' },
    messages: [DebateMessageSchema],
    verdict: { type: VerdictSchema, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'createdAt' } }
);

export default mongoose.models.Debate || mongoose.model<DebateDocument>('Debate', DebateSchema);
