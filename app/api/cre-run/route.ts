import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { connectDB } from '@/lib/db';
import ProposalModel from '@/lib/models/Proposal';
import { initPipelineForProposal, processStepLog } from '@/lib/cre-results-store';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const SCENARIOS: Record<string, string> = {
  a: 'scenario-a-malicious.json',
  b: 'scenario-b-safe.json',
  c: 'scenario-c-split.json',
  d: 'scenario-d-vote-change.json',
  e: 'scenario-e-emergency.json',
  f: 'scenario-f-contradictory.json',
};

const PROTOCOL_GOVERNORS: Record<string, { name: string; address: string }> = {
  aave: { name: 'Aave Governance V3', address: process.env.NEXT_PUBLIC_GOVERNOR_AAVE || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' },
  compound: { name: 'Compound Governor Bravo', address: process.env.NEXT_PUBLIC_GOVERNOR_COMPOUND || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' },
  uniswap: { name: 'Uniswap Governor', address: process.env.NEXT_PUBLIC_GOVERNOR_UNISWAP || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' },
  defi: { name: 'SenateGovernor', address: process.env.NEXT_PUBLIC_GOVERNOR_DEFAULT || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' },
};

const DEPLOYER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

export async function GET(request: NextRequest) {
  const scenario = request.nextUrl.searchParams.get('scenario') || 'b';
  const payloadFile = SCENARIOS[scenario];

  if (!payloadFile) {
    return new Response(
      JSON.stringify({ error: `Unknown scenario: ${scenario}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const encoder = new TextEncoder();
  const projectRoot = path.resolve(process.cwd());
  const workflowDir = path.join(projectRoot, 'senate-workflow');
  const payloadPath = path.join(workflowDir, 'payloads', payloadFile);
  const creBin = path.join(process.env.HOME || '', '.cre', 'bin', 'cre');

  // Read the payload to get proposal details
  let proposalData: { id: string; title: string; protocol: string; description: string; proposer: string; calldata?: string } | null = null;
  try {
    const payloadContent = await fs.readFile(payloadPath, 'utf-8');
    proposalData = JSON.parse(payloadContent);
  } catch (e) {
    console.error('[CRE Run] Failed to read payload:', e);
  }

  // Create proposal in MongoDB immediately with 'debating' status
  // Generate a unique ID so the same template can be run multiple times
  if (proposalData) {
    try {
      await connectDB();
      const protocol = proposalData.protocol || 'defi';
      const governor = PROTOCOL_GOVERNORS[protocol] || PROTOCOL_GOVERNORS.defi;
      const blockNumber = Math.floor(19_000_000 + Math.random() * 1_000_000);

      const runSuffix = Date.now().toString(36);
      const uniqueId = `${proposalData.id}-${runSuffix}`;
      proposalData.id = uniqueId;

      await ProposalModel.create({
        proposalId: uniqueId,
        protocol,
        title: proposalData.title,
        description: proposalData.description,
        proposer: proposalData.proposer || DEPLOYER_ADDRESS,
        startBlock: blockNumber,
        endBlock: blockNumber + 50400,
        status: 'debating',
        chainId: 9991,
        contractAddress: governor.address,
        rawCalldata: proposalData.calldata || undefined,
      });
      console.log(`[CRE Run] Created proposal ${uniqueId} with status 'debating'`);
      initPipelineForProposal(uniqueId, proposalData.title, protocol);
    } catch (e) {
      console.error('[CRE Run] Failed to create proposal:', e);
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: string) => {
        const event = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
        try {
          controller.enqueue(encoder.encode(`data: ${event}\n\n`));
        } catch {}
      };

      send('status', `Starting CRE workflow simulation (scenario ${scenario})...`);

      // Write a modified payload with the unique proposal ID to a temp file
      let actualPayloadPath = payloadPath;
      if (proposalData) {
        const tmpPath = path.join(workflowDir, 'payloads', `.tmp-${proposalData.id}.json`);
        const payloadContent = JSON.parse(await fs.readFile(payloadPath, 'utf-8'));
        payloadContent.id = proposalData.id;
        await fs.writeFile(tmpPath, JSON.stringify(payloadContent, null, 2));
        actualPayloadPath = tmpPath;
        // Clean up temp file after a delay
        setTimeout(() => fs.unlink(tmpPath).catch(() => {}), 120000);
      }

      const child = spawn(
        creBin,
        [
          'workflow', 'simulate', 'my-senate-workflow',
          '--target', 'vtn-simulation',
          '--broadcast',
          '--non-interactive',
          '--trigger-index', '0',
          '--http-payload', actualPayloadPath,
          '-e', '.env',
        ],
        {
          cwd: workflowDir,
          env: {
            ...process.env,
            PATH: `${path.join(process.env.HOME || '', '.cre', 'bin')}:${process.env.PATH}`,
          },
        }
      );

      child.stdout.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          send('log', line);
          if (proposalData?.id) {
            processStepLog(proposalData.id, line);
          }
        }
      });

      child.stderr.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          send('log', line);
          if (proposalData?.id) {
            processStepLog(proposalData.id, line);
          }
        }
      });

      child.on('close', (code) => {
        send('complete', `CRE workflow exited with code ${code}`);
        try { controller.close(); } catch {}
      });

      child.on('error', (err) => {
        send('error', err.message);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
