'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';

const TEMPLATE_PROPOSALS = [
  {
    id: 'a',
    label: 'Malicious Treasury Drain',
    desc: 'Emergency 500K COMP transfer',
    protocol: 'Compound',
    color: 'border-red-500/50 hover:border-red-500',
    badge: 'FAIL expected',
    badgeColor: 'bg-red-500/20 text-red-400',
    calldata: `// Compound GovernorBravo.propose() calldata

targets: [
  0xc00e94Cb662C3520282E6f5717214004A7f26888  // COMP Token
]

values: [0]

signatures: [
  "transfer(address,uint256)"
]

calldatas: [
  abi.encode(
    0xDeaDbeeF00000000000000000000000000000000,  // recipient: unknown external address
    500000000000000000000000                       // amount: 500,000 COMP (18 decimals)
  )
]

// Execution: Timelock calls COMP.transfer(0xDeaD...beeF, 500000e18)
// WARNING: Transfers treasury funds to unverified external address`,
  },
  {
    id: 'b',
    label: 'Safe Collateral Addition',
    desc: 'Add WBTC on Aave V3 (70% LTV)',
    protocol: 'Aave',
    color: 'border-emerald-500/50 hover:border-emerald-500',
    badge: 'PASS expected',
    badgeColor: 'bg-emerald-500/20 text-emerald-400',
    calldata: `// Aave V3 Governance proposal calldata

targets: [
  0x64b761D848206f447Fe2dd461b0c635Ec39EbB27  // Aave V3 PoolConfigurator
]

values: [0]

signatures: [
  "configureReserveAsCollateral(address,uint256,uint256,uint256)"
]

calldatas: [
  abi.encode(
    0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599,  // asset: WBTC
    7000,                                           // ltv: 70.00%
    7500,                                           // liquidationThreshold: 75.00%
    11000                                           // liquidationBonus: 110.00%
  )
]

// Execution: Timelock calls PoolConfigurator.configureReserveAsCollateral(WBTC, 7000, 7500, 11000)`,
  },
  {
    id: 'c',
    label: 'Harmful Fee Change',
    desc: 'Increase UNI/ETH pool fee to 0.3%',
    protocol: 'Uniswap',
    color: 'border-amber-500/50 hover:border-amber-500',
    badge: 'Split vote',
    badgeColor: 'bg-amber-500/20 text-amber-400',
    calldata: `// Uniswap Governance proposal calldata

targets: [
  0x1F98431c8aD98523631AE4a59f267346ea31F984  // Uniswap V3 Factory
]

values: [0]

signatures: [
  "enableFeeAmount(uint24,int24)"
]

calldatas: [
  abi.encode(
    3000,   // fee: 0.3% (in hundredths of a bip)
    60      // tickSpacing: 60
  )
]

// Execution: Timelock calls Factory.enableFeeAmount(3000, 60)
// Note: Existing 0.05% pool liquidity is NOT automatically moved.`,
  },
  {
    id: 'd',
    label: 'Reserve Factor Reduction',
    desc: 'Reduce USDC reserve 15% to 10%',
    protocol: 'Compound',
    color: 'border-orange-500/50 hover:border-orange-500',
    badge: 'Vote change',
    badgeColor: 'bg-orange-500/20 text-orange-400',
    calldata: `// Compound V3 Configurator proposal calldata

targets: [
  0x316f9708bB98af7dA9c68C1C3b5e79039cD336E3  // Compound V3 Configurator
]

values: [0]

signatures: [
  "setReserveFactorForMarket(address,uint64)"
]

calldatas: [
  abi.encode(
    0xc3d688B66703497DAA19211EEdff47f25384cdc3,  // cUSDCv3 Comet proxy
    1000                                           // reserveFactor: 10.00%
  )
]

// Execution: Timelock calls Configurator.setReserveFactorForMarket(cUSDCv3, 1000)`,
  },
  {
    id: 'e',
    label: 'Emergency Minting Auth',
    desc: 'Grant minting to core team multisig',
    protocol: 'Aave',
    color: 'border-purple-500/50 hover:border-purple-500',
    badge: 'Attack pattern',
    badgeColor: 'bg-purple-500/20 text-purple-400',
    calldata: `// Aave Governance proposal calldata

targets: [
  0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9  // AAVE Token
]

values: [0]

signatures: [
  "grantRole(bytes32,address)"
]

calldatas: [
  abi.encode(
    0x9f2df0fed...c8956a6,  // MINTER_ROLE
    0x25F2226B597E8F9514B3F68F00f494cF4f286491  // core team multisig
  )
]

// Execution: Timelock calls AAVE.grantRole(MINTER_ROLE, multisig)
// WARNING: "1% per quarter" limit is social agreement, not enforced on-chain.`,
  },
  {
    id: 'f',
    label: 'Contradictory Oracle Update',
    desc: 'Description says oracle update, code drains treasury',
    protocol: 'Compound',
    color: 'border-rose-600/50 hover:border-rose-600',
    badge: 'ATTACK',
    badgeColor: 'bg-rose-600/20 text-rose-300',
    calldata: `// ⚠️ CALLDATA DOES NOT MATCH DESCRIPTION ⚠️
// Description: "Update Chainlink price feed addresses"
// Code actually: Transfer ownership + drain reserves

targets: [
  0x6d903f6003cca6255D85CcA4D3B5E5146dC33925,  // Compound Timelock
  0xc3d688B66703497DAA19211EEdff47f25384cdc3   // cUSDCv3 Comet proxy
]

values: [0, 0]

signatures: [
  "transferOwnership(address)",
  "withdrawReserves(address,uint256)"
]

calldatas: [
  abi.encode(0xAttacker...),    // new owner: attacker EOA
  abi.encode(0xAttacker..., MAX_UINT)  // drain all USDC reserves
]

// ACTUAL EXECUTION:
//   1. Timelock.transferOwnership(attacker)
//   2. Comet.withdrawReserves(attacker, MAX_UINT)
// Classic "description mismatch" governance attack.`,
  },
];

export default function AdminPage() {
  const [creLogs, setCRELogs] = useState<string[]>([]);
  const [creRunning, setCRERunning] = useState(false);
  const [creScenario, setCREScenario] = useState('');
  const [codeModalId, setCodeModalId] = useState<string | null>(null);
  const creTerminalRef = useRef<HTMLDivElement | null>(null);

  const runCREWorkflow = (scenario: string) => {
    setCRERunning(true);
    setCREScenario(scenario);
    setCRELogs([]);

    const es = new EventSource(`/api/cre-run?scenario=${scenario}`);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'log' || data.type === 'status') {
          setCRELogs((prev) => [...prev, data.data]);
        } else if (data.type === 'complete') {
          setCRELogs((prev) => [...prev, `\n${data.data}`]);
          setCRERunning(false);
          es.close();
        } else if (data.type === 'error') {
          setCRELogs((prev) => [...prev, `ERROR: ${data.data}`]);
          setCRERunning(false);
          es.close();
        }
      } catch {}
    };

    es.onerror = () => {
      setCRERunning(false);
      es.close();
    };
  };

  useEffect(() => {
    if (creTerminalRef.current) {
      creTerminalRef.current.scrollTop = creTerminalRef.current.scrollHeight;
    }
  }, [creLogs]);

  const activeCodeModal = TEMPLATE_PROPOSALS.find((s) => s.id === codeModalId);

  return (
    <div className="min-h-screen bg-senate-bg dark:bg-dark-bg">
      <Navbar />

      {/* Code Snippet Modal */}
      <AnimatePresence>
        {activeCodeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setCodeModalId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl border border-gray-700 bg-gray-950 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-800 px-5 py-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{activeCodeModal.label}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Executable Proposal Calldata</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-orange-900/30 px-2 py-0.5 text-[9px] font-bold uppercase text-orange-400 tracking-wider">
                    {activeCodeModal.protocol}
                  </span>
                  <button
                    onClick={() => setCodeModalId(null)}
                    className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[calc(80vh-60px)] p-5">
                <pre className="font-mono text-[11px] leading-relaxed text-gray-300 whitespace-pre-wrap break-words">
                  {activeCodeModal.calldata}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-7xl px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            CRE Workflow Console
          </h1>
          <p className="mb-6 text-gray-500 dark:text-gray-400">
            Run Chainlink CRE workflows with real Tenderly simulation + Gemini AI debate + DON-signed report
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* What Submitting a Proposal Triggers */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg">⚡</span>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  What happens when a proposal is submitted?
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  When a proposal is created on the <strong>AaveProposalMock</strong> contract (our dummy Aave governance contract),
                  it emits a <code className="rounded bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 text-[11px] font-mono">ProposalCreated</code> event.
                  The Chainlink CRE workflow listens for this event and triggers the full SENATE pipeline:
                </p>
                <ol className="mt-2 text-xs text-gray-600 dark:text-gray-400 list-decimal list-inside space-y-0.5">
                  <li>Tenderly VTN forks mainnet and simulates the proposal&apos;s on-chain effects</li>
                  <li>Gemini AI scans against 9 historical governance attack patterns</li>
                  <li>4 AI agents + Angel (chairperson) debate the proposal via Gemini</li>
                  <li>Gemini cross-checks the proposal <strong>description</strong> against the <strong>executable calldata</strong> for mismatches</li>
                  <li>DON-signed report is published on-chain to SenateReport.sol</li>
                </ol>
                <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-500">
                  Click any card below to view its executable calldata, or press the <strong>▶</strong> play button to run the CRE workflow.
                </p>
              </div>
            </div>
          </div>

          {/* Scenario Buttons */}
          <div className="rounded-2xl border border-senate-border dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-sm">
            <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-white">
              Run CRE Workflow with Template Proposals
            </h3>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              Each proposal includes a <strong>description</strong> (what voters read) and <strong>executable calldata</strong> (what actually runs on-chain).
              Click a card to inspect the calldata. Press <strong>▶</strong> to run the workflow. Same template can be run multiple times.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TEMPLATE_PROPOSALS.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setCodeModalId(s.id)}
                  className={`relative group rounded-xl border-2 ${s.color} bg-white dark:bg-dark-surface p-4 text-left transition-all ${
                    creRunning && creScenario === s.id ? 'ring-2 ring-orange-500' : ''
                  } ${creRunning ? '' : 'hover:shadow-md hover:scale-[1.01]'} cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white pr-8">{s.label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${s.badgeColor}`}>{s.badge}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="rounded-full bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 text-[9px] font-bold uppercase text-orange-700 dark:text-orange-400 tracking-wider">
                      {s.protocol}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{s.desc}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 group-hover:text-orange-400 transition-colors">
                      Click to view calldata
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!creRunning) runCREWorkflow(s.id);
                      }}
                      disabled={creRunning}
                      className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all ${
                        creRunning
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:bg-orange-500/20 hover:scale-110 cursor-pointer'
                      }`}
                      title="Run CRE Workflow"
                    >
                      {creScenario === s.id && creRunning ? (
                        <motion.div
                          className="h-5 w-5 rounded-full border-2 border-orange-500 border-t-transparent"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                        />
                      ) : (
                        <svg className="h-5 w-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real Mainnet Governance Contracts */}
          <div className="rounded-2xl border border-senate-border dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-sm">
            <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-white">
              Mainnet Governance Contracts (on Tenderly VTN Fork)
            </h3>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              SENATE simulates proposals against <strong>real mainnet contracts</strong> on the Tenderly Virtual TestNet (mainnet fork). The simulation executes the actual DeFi action using the protocol&apos;s Timelock/Executor as the caller — producing real gas usage, events, and state changes.
            </p>
            <div className="space-y-2">
              {[
                {
                  protocol: 'Aave V3',
                  governor: { label: 'Governance V3', address: '0x9AEE0B04504CeF83A65AC3f0e838D0593BCb2BC7' },
                  executor: { label: 'Short Executor', address: '0xEE56e2B3D491590B5b31738cC34d5232F378a8D5' },
                  targets: [
                    { label: 'PoolConfigurator', address: '0x64b761D848206f447Fe2dd461b0c635Ec39EbB27' },
                    { label: 'AAVE Token', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9' },
                  ],
                  event: 'ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,bytes32)',
                },
                {
                  protocol: 'Compound',
                  governor: { label: 'GovernorBravo', address: '0xc0Da02939E1441F497fd74F78cE7Decb17B66529' },
                  executor: { label: 'Timelock', address: '0x6d903f6003cca6255D85CcA4D3B5E5146dC33925' },
                  targets: [
                    { label: 'COMP Token', address: '0xc00e94Cb662C3520282E6f5717214004A7f26888' },
                    { label: 'cUSDC (V2)', address: '0x39AA39c021dfbaE8faC545936693aC917d5E7563' },
                  ],
                  event: 'ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)',
                },
                {
                  protocol: 'Uniswap',
                  governor: { label: 'GovernorBravo', address: '0x408ED6354d4973f66138C91495F2f2FCbd8724C3' },
                  executor: { label: 'Timelock', address: '0x1a9C8182C09F50C8318d769245beA52c32BE35BC' },
                  targets: [
                    { label: 'V3 Factory', address: '0x1F98431c8aD98523631AE4a59f267346ea31F984' },
                    { label: 'UNI Token', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' },
                  ],
                  event: 'ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)',
                },
              ].map((g) => (
                <div key={g.protocol} className="rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-surface p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{g.protocol}</span>
                    <span className="text-[10px] text-emerald-500 font-medium">Mainnet Fork</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 w-20 shrink-0">Governor</span>
                      <span className="font-mono text-orange-400 truncate" title={g.governor.address}>
                        {g.governor.label}: {g.governor.address.slice(0, 6)}...{g.governor.address.slice(-4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 w-20 shrink-0">Executor</span>
                      <span className="font-mono text-cyan-400 truncate" title={g.executor.address}>
                        {g.executor.label}: {g.executor.address.slice(0, 6)}...{g.executor.address.slice(-4)}
                      </span>
                    </div>
                    {g.targets.map((t) => (
                      <div key={t.address} className="flex items-center gap-2">
                        <span className="text-gray-400 w-20 shrink-0">Target</span>
                        <span className="font-mono text-gray-300 truncate" title={t.address}>
                          {t.label}: {t.address.slice(0, 6)}...{t.address.slice(-4)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="font-mono text-[9px] text-gray-500 mt-2 break-all leading-relaxed">
                    event {g.event}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-gray-500 dark:text-gray-500">
              Simulation sends the real <code className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 font-mono">eth_sendTransaction</code> from the Executor/Timelock address to the target contract on VTN.
              Tenderly auto-impersonates any <code className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 font-mono">from</code> address — no private key needed.
            </p>
          </div>

          {/* CRE Terminal Output */}
          <div className="rounded-2xl border border-senate-border dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                CRE Terminal
                {creRunning && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Running
                  </span>
                )}
              </h3>
              <button
                onClick={() => setCRELogs([])}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>
            <div
              ref={creTerminalRef}
              className="max-h-[500px] overflow-y-auto rounded-xl bg-gray-950 p-4 font-mono text-[11px] leading-relaxed text-gray-300"
            >
              {creLogs.length === 0 ? (
                <span className="text-gray-600">
                  $ cre workflow simulate {'\n'}
                  Select a scenario above to run the CRE workflow...
                </span>
              ) : (
                creLogs.map((log, i) => (
                  <div key={i} className={
                    log.includes('[USER LOG]') ? (
                      log.includes('[ERROR]') ? 'text-red-400' :
                      log.includes('Pipeline Complete') || log.includes('Pipeline Started') ? 'text-emerald-400 font-bold' :
                      log.includes('[Step') ? 'text-cyan-400' :
                      log.includes('[Gemini]') ? 'text-purple-400' :
                      log.includes('ALERT') ? 'text-amber-400 font-bold' :
                      log.includes('CHANGED') ? 'text-pink-400' :
                      log.includes('voted:') || log.includes('PASS') || log.includes('FAIL') ? 'text-orange-300' :
                      'text-gray-300'
                    ) :
                    log.includes('Compiling') || log.includes('compiled') ? 'text-green-400' :
                    log.includes('Initializing') ? 'text-gray-500' :
                    log.includes('Simulation Result') ? 'text-emerald-400 font-bold' :
                    log.includes('exited with code 0') ? 'text-emerald-400' :
                    log.includes('exited with code') ? 'text-red-400' :
                    log.includes('ERROR') ? 'text-red-400' :
                    'text-gray-400'
                  }>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
