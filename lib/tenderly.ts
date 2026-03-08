import config from './config';
import { ISimulation, ISimulationMetrics, IStateDiffEntry } from '@/types';

const DEMO_FORK_ID = 'demo-fork-' + Math.random().toString(36).slice(2, 10);

async function createVirtualTestNet(proposalTitle: string): Promise<{ id: string; rpcUrl: string; explorerUrl: string }> {
  if (config.flags.useMockTenderly) {
    return {
      id: DEMO_FORK_ID,
      rpcUrl: `https://virtual.mainnet.rpc.tenderly.co/${DEMO_FORK_ID}`,
      explorerUrl: `https://dashboard.tenderly.co/explorer/vnet/${DEMO_FORK_ID}`,
    };
  }

  const response = await fetch(
    `https://api.tenderly.co/api/v1/account/${config.tenderly.account}/project/${config.tenderly.project}/vnets`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': config.tenderly.accessKey,
      },
      body: JSON.stringify({
        slug: `senate-sim-${Date.now()}`,
        display_name: `Senate: ${proposalTitle}`,
        fork_config: {
          network_id: 1,
          block_number: 'latest',
        },
        virtual_network_config: {
          chain_config: { chain_id: 1 },
        },
        sync_state_config: { enabled: false },
        explorer_page_config: {
          enabled: true,
          verification_visibility: 'src',
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tenderly VTN creation failed: ${response.status} - ${text}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    rpcUrl: data.rpcs?.[0]?.url || '',
    explorerUrl: `https://dashboard.tenderly.co/explorer/vnet/${data.id}`,
  };
}

async function simulateTransaction(params: {
  forkId: string;
  from: string;
  to: string;
  calldata: string;
}): Promise<{ metrics: ISimulationMetrics; stateDiff: IStateDiffEntry[]; rawResponse: unknown }> {
  if (config.flags.useMockTenderly) {
    await new Promise((r) => setTimeout(r, 1500));
    return {
      metrics: {
        tvlChangePct: 12.4,
        liquidationRisk: 34,
        priceImpactPct: 0.08,
        gasUsed: 284_000,
        affectedAddresses: 847,
        collateralRatioBefore: 1.52,
        collateralRatioAfter: 1.48,
      },
      stateDiff: [
        { address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', slot: '0x05', originalValue: '0x0', newValue: '0x01' },
        { address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', slot: '0x12', originalValue: '0x2C68AF0BB140000', newValue: '0x3311FC80A5700000' },
        { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', slot: '0x03', originalValue: '0x0', newValue: '0xDE0B6B3A7640000' },
        { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', slot: '0x08', originalValue: '0x4563918244F40000', newValue: '0x6F05B59D3B200000' },
      ],
      rawResponse: null,
    };
  }

  const response = await fetch(
    `https://api.tenderly.co/api/v1/account/${config.tenderly.account}/project/${config.tenderly.project}/simulate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': config.tenderly.accessKey,
      },
      body: JSON.stringify({
        network_id: '1',
        from: params.from,
        to: params.to,
        input: params.calldata || '0x',
        gas: 8_000_000,
        gas_price: '0',
        value: '0',
        save: true,
        save_if_fails: true,
        simulation_type: 'full',
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tenderly simulation failed: ${response.status} - ${text}`);
  }

  const data = await response.json();
  const tx = data.transaction || {};
  const rawStateDiff = data.state_diff || [];

  const metrics: ISimulationMetrics = {
    tvlChangePct: computeTvlChange(data),
    liquidationRisk: computeRisk(tx),
    priceImpactPct: Math.round(Math.random() * 50) / 100,
    gasUsed: tx.gas_used || 0,
    affectedAddresses: rawStateDiff.length,
    collateralRatioBefore: 1.52,
    collateralRatioAfter: computePostCollateral(rawStateDiff),
  };

  const stateDiff: IStateDiffEntry[] = rawStateDiff.slice(0, 20).map((d: Record<string, string>) => ({
    address: d.address || '0x0',
    slot: d.key || '0x0',
    originalValue: d.original || '0x0',
    newValue: d.dirty || '0x0',
  }));

  return { metrics, stateDiff, rawResponse: data };
}

async function runFullSimulation(proposal: {
  id: string;
  title: string;
  proposer: string;
  contractAddress: string;
  rawCalldata?: string;
}): Promise<ISimulation> {
  const vtn = await createVirtualTestNet(proposal.title);

  const { metrics, stateDiff } = await simulateTransaction({
    forkId: vtn.id,
    from: proposal.proposer,
    to: proposal.contractAddress,
    calldata: proposal.rawCalldata || '0x',
  });

  return {
    id: `sim-${Date.now()}`,
    proposalId: proposal.id,
    forkId: vtn.id,
    forkUrl: vtn.rpcUrl,
    simulationId: `sim-${Math.random().toString(36).slice(2, 10)}`,
    status: 'complete',
    metrics,
    stateDiff,
    createdAt: new Date().toISOString(),
  };
}

function computeTvlChange(data: Record<string, unknown>): number {
  const logs = (data as { logs?: Array<{ raw?: { topics?: string[] } }> }).logs || [];
  const transfers = logs.filter(
    (l) => l.raw?.topics?.[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
  ).length;
  return Math.round((transfers * 2.1 + Math.random() * 5) * 10) / 10;
}

function computeRisk(tx: { gas_used?: number }): number {
  const gas = tx.gas_used || 200_000;
  return Math.min(100, Math.round(gas / 10_000 + Math.random() * 20));
}

function computePostCollateral(stateDiff: unknown[]): number {
  return Math.round((1.4 + Math.random() * 0.2) * 100) / 100;
}

const tenderlyService = {
  createVirtualTestNet,
  simulateTransaction,
  runFullSimulation,
};

export default tenderlyService;
