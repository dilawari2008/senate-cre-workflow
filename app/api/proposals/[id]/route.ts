import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ProposalModel from '@/lib/models/Proposal';
import SimulationModel from '@/lib/models/Simulation';
import DebateModel from '@/lib/models/Debate';
import ReportModel from '@/lib/models/Report';
import { getCREResult } from '@/lib/cre-results-store';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await connectDB();

  if (!db) {
    return NextResponse.json({ error: 'Database not connected' }, { status: 503 });
  }

  try {
    let proposal = await ProposalModel.findOne({ proposalId: id }).lean();
    if (!proposal) {
      proposal = await ProposalModel.findById(id).lean().catch(() => null);
    }
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const pId = proposal.proposalId || id;
    const simulation = await SimulationModel.findOne({ proposalId: pId }).lean();
    const debate = await DebateModel.findOne({ proposalId: pId }).lean();
    const report = await ReportModel.findOne({ proposalId: pId }).lean();

    const creResult = getCREResult(pId);
    let pipelineSteps = creResult?.pipelineSteps
      || (report as any)?.pipelineSteps
      || null;
    const vtnSimTxUrl = creResult?.vtnSimTxUrl
      || (report as any)?.vtnSimTxUrl
      || null;
    const liveDebateMessages = creResult?.messages || [];

    // Reconstruct pipeline steps from timing data if report exists but no persisted steps
    if (!pipelineSteps && report && (report as any).timing) {
      const t = (report as any).timing;
      pipelineSteps = [
        { id: 'proposal_submitted', label: 'Proposal Submitted', status: 'complete' },
        { id: 'tenderly_simulation', label: 'Tenderly VTN Simulation', status: 'complete', durationMs: t.simulation },
        { id: 'attack_scan', label: 'Historical Attack Pattern Scan (Gemini)', status: 'complete', durationMs: t.attackScan },
        { id: 'ai_debate', label: 'AI Senate Debate (Gemini)', status: 'complete', durationMs: t.debate },
        { id: 'senate_verdict', label: 'Senate Verdict Computation', status: 'complete' },
        { id: 'don_report', label: 'DON-Signed Report Generation', status: 'complete', durationMs: t.report },
        { id: 'onchain_publish', label: 'Publishing to SenateReport.sol', status: 'complete', durationMs: t.write },
        { id: 'webhook', label: 'Finalizing & Persisting', status: 'complete' },
        { id: 'complete', label: 'Pipeline Complete', status: 'complete' },
      ];
    }

    return NextResponse.json({
      proposal: { ...proposal, id: proposal._id?.toString() || pId },
      simulation: simulation || null,
      debate: debate || null,
      report: report || null,
      pipelineSteps,
      vtnSimTxUrl,
      liveDebateMessages,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch proposal' }, { status: 500 });
  }
}
