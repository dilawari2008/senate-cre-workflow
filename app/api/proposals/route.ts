import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ProposalModel from '@/lib/models/Proposal';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const protocol = request.nextUrl.searchParams.get('protocol') || undefined;
  const status = request.nextUrl.searchParams.get('status') || undefined;

  const db = await connectDB();

  if (!db) {
    return NextResponse.json({ proposals: [] });
  }

  try {
    const filter: Record<string, string> = {};
    if (protocol && protocol !== 'all') filter.protocol = protocol;
    if (status && status !== 'all') filter.status = status;

    const proposals = await ProposalModel.find(filter).sort({ createdAt: -1 }).lean();
    const mapped = proposals.map((p) => ({ ...p, id: p.proposalId || p._id?.toString() }));
    return NextResponse.json({ proposals: mapped });
  } catch {
    return NextResponse.json({ proposals: [] });
  }
}
