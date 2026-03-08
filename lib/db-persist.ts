import { connectDB } from './db';
import ProposalModel from './models/Proposal';
import SimulationModel from './models/Simulation';
import DebateModel from './models/Debate';
import ReportModel from './models/Report';
import type { IProposal, ISimulation, IDebate, ISenateReport } from '@/types';

export async function persistProposal(proposal: IProposal) {
  const db = await connectDB();
  if (!db) return;
  try {
    await ProposalModel.findOneAndUpdate(
      { proposalId: proposal.proposalId },
      {
        proposalId: proposal.proposalId,
        protocol: proposal.protocol,
        title: proposal.title,
        description: proposal.description,
        proposer: proposal.proposer,
        startBlock: proposal.startBlock,
        endBlock: proposal.endBlock,
        status: proposal.status,
        chainId: proposal.chainId,
        contractAddress: proposal.contractAddress,
        rawCalldata: proposal.rawCalldata,
      },
      { upsert: true, new: true }
    );
  } catch (e) {
    console.error('[DB] Failed to persist proposal:', e);
  }
}

export async function persistSimulation(simulation: ISimulation) {
  const db = await connectDB();
  if (!db) return;
  try {
    await SimulationModel.findOneAndUpdate(
      { proposalId: simulation.proposalId },
      {
        proposalId: simulation.proposalId,
        forkId: simulation.forkId,
        forkUrl: simulation.forkUrl,
        simulationId: simulation.simulationId,
        status: simulation.status,
        stateDiff: simulation.stateDiff,
        metrics: simulation.metrics,
      },
      { upsert: true, new: true }
    );
  } catch (e) {
    console.error('[DB] Failed to persist simulation:', e);
  }
}

export async function persistDebate(debate: IDebate) {
  const db = await connectDB();
  if (!db) return;
  try {
    await DebateModel.findOneAndUpdate(
      { proposalId: debate.proposalId },
      {
        proposalId: debate.proposalId,
        simulationId: debate.simulationId,
        status: debate.status,
        messages: debate.messages,
        verdict: debate.verdict,
        completedAt: debate.completedAt,
      },
      { upsert: true, new: true }
    );
  } catch (e) {
    console.error('[DB] Failed to persist debate:', e);
  }
}

export async function persistReport(report: ISenateReport & { pipelineSteps?: any[]; vtnSimTxUrl?: string }) {
  const db = await connectDB();
  if (!db) return;
  try {
    await ReportModel.findOneAndUpdate(
      { proposalId: report.proposalId },
      {
        proposalId: report.proposalId,
        debateId: report.debateId,
        simulationId: report.simulationId,
        contentHash: report.contentHash,
        onChainTxHash: report.onChainTxHash,
        onChainReportId: report.onChainReportId,
        creForwarderAddress: report.creForwarderAddress,
        blockNumber: report.blockNumber,
        verifiedAt: report.verifiedAt,
        report: report.report,
        pipelineSteps: report.pipelineSteps,
        vtnSimTxUrl: report.vtnSimTxUrl,
      },
      { upsert: true, new: true }
    );
  } catch (e) {
    console.error('[DB] Failed to persist report:', e);
  }
}

export async function persistFullPipelineResult(data: {
  proposal: IProposal;
  simulation: ISimulation;
  debate: IDebate;
  report: ISenateReport;
}) {
  await Promise.all([
    persistProposal(data.proposal),
    persistSimulation(data.simulation),
    persistDebate(data.debate),
    persistReport(data.report),
  ]);
}
