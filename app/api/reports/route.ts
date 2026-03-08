import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ReportModel from '@/lib/models/Report';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await connectDB();

  if (!db) {
    return NextResponse.json({ reports: [] });
  }

  try {
    const reports = await ReportModel.find().sort({ createdAt: -1 }).lean();
    const mapped = reports.map(r => ({
      ...r,
      id: r._id?.toString() || r.proposalId,
    }));
    return NextResponse.json({ reports: mapped });
  } catch {
    return NextResponse.json({ reports: [] });
  }
}
