import { NextResponse } from 'next/server';
import { getAllCREResults } from '@/lib/cre-results-store';
import { connectDB } from '@/lib/db';
import DebateModel from '@/lib/models/Debate';
import ReportModel from '@/lib/models/Report';

export const dynamic = 'force-dynamic';

export async function GET() {
  const inMemory = getAllCREResults();
  const inMemoryIds = new Set(inMemory.map(r => r.proposalId));

  const db = await connectDB();
  if (db) {
    try {
      const dbDebates = await DebateModel.find().sort({ createdAt: -1 }).lean();
      const dbReports = await ReportModel.find().lean();
      const reportMap = new Map(dbReports.map(r => [r.proposalId, r]));

      for (const d of dbDebates) {
        if (inMemoryIds.has(d.proposalId)) continue;
        const report = reportMap.get(d.proposalId);
        inMemory.push({
          proposalId: d.proposalId,
          title: report?.report?.title || d.proposalId,
          protocol: report?.report?.protocol || 'defi',
          status: 'complete',
          events: [],
          messages: d.messages as never[],
          verdict: d.verdict as never || undefined,
          attackMatches: [],
          receivedAt: (d as Record<string, unknown>).createdAt?.toString() || new Date().toISOString(),
          completedAt: d.completedAt?.toString() || undefined,
          txHash: report?.onChainTxHash,
        });
      }
    } catch {
      // non-fatal
    }
  }

  inMemory.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  return NextResponse.json(inMemory);
}
