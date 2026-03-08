import mongoose, { Schema, Document } from 'mongoose';
import type { IProposal } from '@/types';

export interface ProposalDocument extends Document, Omit<IProposal, 'id'> {}

const ProposalSchema = new Schema<ProposalDocument>(
  {
    proposalId: { type: String, required: true, index: true },
    protocol: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    proposer: { type: String, required: true },
    startBlock: { type: Number, required: true },
    endBlock: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'simulating', 'debating', 'complete', 'failed'], default: 'pending' },
    chainId: { type: Number, required: true },
    contractAddress: { type: String, required: true },
    rawCalldata: { type: String },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export default mongoose.models.Proposal || mongoose.model<ProposalDocument>('Proposal', ProposalSchema);
