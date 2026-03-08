import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DebateModel from '@/lib/models/Debate';

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
    const debate = await DebateModel.findOne({ proposalId: id }).lean();
    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }
    return NextResponse.json({ debate });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch debate' }, { status: 500 });
  }
}
