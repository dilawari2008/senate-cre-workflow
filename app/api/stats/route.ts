import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ProposalModel from '@/lib/models/Proposal';
import ReportModel from '@/lib/models/Report';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await connectDB();

  if (!db) {
    return NextResponse.json({
      totalAnalyzed: 0, totalReports: 0, passRate: 0, avgRiskScore: 0, protocolsSupported: 0,
    });
  }

  try {
    const totalAnalyzed = await ProposalModel.countDocuments({ status: 'complete' });
    const reports = await ReportModel.find().lean();
    const totalReports = reports.length;
    const passCount = reports.filter(r => r.report?.recommendation === 'PASS').length;
    const avgRisk = totalReports > 0
      ? Math.round(reports.reduce((s, r) => s + (r.report?.riskScore || 0), 0) / totalReports)
      : 0;
    const protocols = await ProposalModel.distinct('protocol');

    return NextResponse.json({
      totalAnalyzed,
      totalReports,
      passRate: totalReports > 0 ? Math.round((passCount / totalReports) * 100) : 0,
      avgRiskScore: avgRisk,
      protocolsSupported: protocols.length,
    });
  } catch {
    return NextResponse.json({
      totalAnalyzed: 0, totalReports: 0, passRate: 0, avgRiskScore: 0, protocolsSupported: 0,
    });
  }
}
