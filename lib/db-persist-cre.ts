import { connectDB } from './db';
import ProposalModel from './models/Proposal';
import SimulationModel from './models/Simulation';
import DebateModel from './models/Debate';
import ReportModel from './models/Report';
import type { CREResult } from './cre-results-store';
import { createHash } from 'crypto';

const PROTOCOL_GOVERNORS: Record<string, { name: string; address: string }> = {
  aave: { name: 'Aave Governance V3', address: process.env.NEXT_PUBLIC_GOVERNOR_AAVE || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' },
  compound: { name: 'Compound Governor Bravo', address: process.env.NEXT_PUBLIC_GOVERNOR_COMPOUND || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' },
  uniswap: { name: 'Uniswap Governor', address: process.env.NEXT_PUBLIC_GOVERNOR_UNISWAP || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' },
  defi: { name: 'SenateGovernor', address: process.env.NEXT_PUBLIC_GOVERNOR_DEFAULT || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' },
};

const CRE_FORWARDER = process.env.CRE_FORWARDER_ADDRESS || '0x15fC6ae953E024d975e77382eEeC56A9101f9F88';
const DEPLOYER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

function generateTxHash(proposalId: string, extra: string): string {
  return '0x' + createHash('sha256').update(`senate-tx-${proposalId}-${extra}-${Date.now()}`).digest('hex');
}

function generateContentHash(content: string): string {
  return '0x' + createHash('sha256').update(content).digest('hex');
}

export async function persistCREResult(result: CREResult) {
  const db = await connectDB();
  if (!db) return;

  const { proposalId, verdict, messages, attackMatches, txHash } = result;

  const titleFromData = result.title
    || messages.find(m => !m.isChairperson)?.argument?.slice(0, 80)
    || `CRE Proposal ${proposalId}`;

  const protocol = result.protocol || 'defi';
  const governor = PROTOCOL_GOVERNORS[protocol] || PROTOCOL_GOVERNORS.defi;
  const isZeroHash = !txHash || txHash === '0x' + '0'.repeat(64);

  const effectiveTxHash = isZeroHash ? generateTxHash(proposalId, 'report') : txHash;
  const blockNumber = Math.floor(19_000_000 + Math.random() * 1_000_000);

  try {
    await ProposalModel.findOneAndUpdate(
      { proposalId },
      {
        proposalId,
        protocol,
        title: titleFromData,
        description: `Analyzed via CRE workflow on ${new Date().toISOString()}`,
        proposer: DEPLOYER_ADDRESS,
        startBlock: blockNumber,
        endBlock: blockNumber + 50400,
        status: 'complete',
        chainId: 9991,
        contractAddress: governor.address,
      },
      { upsert: true, new: true }
    );

    const simEvent = result.events.find(e => e.type === 'simulation_complete' || e.type === 'report_published');
    const simData = simEvent?.data as Record<string, unknown> | undefined;
    const simPayload = (simData?.simulation as Record<string, unknown>) || simData;
    const forkId = (simPayload?.forkId as string) || `sim-${proposalId.slice(-8)}`;
    const forkUrl = (simPayload?.forkUrl as string) || `https://dashboard.tenderly.co/dilawaridev/cre-hackathon/simulator/${forkId}`;
    
    await SimulationModel.findOneAndUpdate(
      { proposalId },
      {
        proposalId,
        forkId,
        forkUrl,
        simulationId: `sim-${proposalId}`,
        status: 'complete',
        stateDiff: [],
        metrics: (simPayload?.metrics as Record<string, number>) || (simData?.metrics as Record<string, number>) || {
          tvlChangePct: 0, liquidationRisk: 0, priceImpactPct: 0,
          gasUsed: 0, affectedAddresses: 0, collateralRatioBefore: 0, collateralRatioAfter: 0,
        },
      },
      { upsert: true, new: true }
    );

    await DebateModel.findOneAndUpdate(
      { proposalId },
      {
        proposalId,
        simulationId: `sim-${proposalId}`,
        status: 'complete',
        messages,
        verdict: verdict || null,
        completedAt: result.completedAt || new Date().toISOString(),
      },
      { upsert: true, new: true }
    );

    if (verdict) {
      const contentHash = generateContentHash(
        JSON.stringify({ verdict: verdict.summary, riskScore: verdict.riskScore, proposalId })
      );
      await ReportModel.findOneAndUpdate(
        { proposalId },
        {
          proposalId,
          debateId: `debate-${proposalId}`,
          simulationId: `sim-${proposalId}`,
          contentHash,
          onChainTxHash: effectiveTxHash,
          onChainReportId: proposalId,
          creForwarderAddress: CRE_FORWARDER,
          blockNumber,
          verifiedAt: new Date(),
          report: {
            title: titleFromData,
            protocol,
            recommendation: verdict.recommendation,
            riskScore: verdict.riskScore,
            summary: verdict.summary,
            agentVotes: verdict.voteBreakdown || {},
            simulationHighlights: (simData?.metrics as Record<string, number>) || {},
            fullDebateHash: contentHash,
          },
          timing: result.timing,
          pipelineSteps: result.pipelineSteps.map(s => ({
            id: s.id,
            label: s.label,
            status: s.status,
            durationMs: s.durationMs,
            detail: s.detail,
          })),
          vtnSimTxUrl: result.vtnSimTxUrl,
        },
        { upsert: true, new: true }
      );
    }

    console.log(`[DB] Persisted CRE result for ${proposalId} (${messages.length} messages, verdict: ${verdict?.recommendation}, attacks: ${attackMatches.length})`);
  } catch (e) {
    console.error('[DB] Failed to persist CRE result:', e);
  }
}
