import { NextResponse } from 'next/server';
import { processCREWebhookEvent, getCREResult } from '@/lib/cre-results-store';
import { persistCREResult } from '@/lib/db-persist-cre';
import { connectDB } from '@/lib/db';
import ProposalModel from '@/lib/models/Proposal';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    console.log(`[CRE Webhook] ${type}`, JSON.stringify(data).slice(0, 300));

    processCREWebhookEvent(type, data || {});

    const proposalId = (data?.proposalId as string);

    // Update proposal status and persist incremental data
    if (proposalId) {
      await connectDB();
      
      if (type === 'pipeline_started') {
        await ProposalModel.findOneAndUpdate(
          { proposalId },
          { status: 'debating' }
        );
      } else if (type === 'simulation_complete') {
        await ProposalModel.findOneAndUpdate(
          { proposalId },
          { status: 'debating' }
        );
        
        // Persist simulation data incrementally
        const result = getCREResult(proposalId);
        if (result) {
          persistCREResult(result).catch(e =>
            console.error('[CRE Webhook] Simulation persist failed:', e)
          );
        }
      } else if (type === 'opening_statement' || type === 'counter_argument' || type === 'chairperson_review') {
        // Persist debate messages incrementally
        const result = getCREResult(proposalId);
        if (result && result.messages.length > 0) {
          persistCREResult(result).catch(e =>
            console.error('[CRE Webhook] Debate message persist failed:', e)
          );
        }
      } else if (type === 'report_published') {
        await ProposalModel.findOneAndUpdate(
          { proposalId },
          { status: 'complete' }
        );
        
        const result = getCREResult(proposalId);
        if (result) {
          persistCREResult(result).catch(e =>
            console.error('[CRE Webhook] DB persist failed:', e)
          );
        }
      }
    }

    return NextResponse.json({ received: true, type });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook error';
    console.error(`[CRE Webhook Error] ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
