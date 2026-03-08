import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ProposalModel from '@/lib/models/Proposal';
import SimulationModel from '@/lib/models/Simulation';

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
    const proposal = await ProposalModel.findOne({ proposalId: id }).lean();
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const simulation = await SimulationModel.findOne({ proposalId: id }).lean();
    return NextResponse.json({ simulation: simulation || null });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch simulation' }, { status: 500 });
  }
}
