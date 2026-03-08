'use client';

import { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import AgentAvatar from '../../components/AgentAvatar';
import RiskGauge from '../../components/RiskGauge';
import AttackPatternAlert from '../../components/AttackPatternAlert';
import DebateChat from '../../components/DebateChat';
import PipelineSteps, { PipelineStepData } from '../../components/PipelineSteps';
import { IProposal, ISimulation, IDebate, ISenateReport, IDebateMessage, SpeakerId } from '@/types';

export default function ProposalDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [proposal, setProposal] = useState<IProposal | null>(null);
  const [simulation, setSimulation] = useState<ISimulation | null>(null);
  const [debate, setDebate] = useState<IDebate | null>(null);
  const [report, setReport] = useState<ISenateReport | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStepData[] | null>(null);
  const [vtnSimTxUrl, setVtnSimTxUrl] = useState<string | null>(null);
  const [liveDebateMessages, setLiveDebateMessages] = useState<IDebateMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = () => {
    fetch(`/api/proposals/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProposal(data.proposal);
        setSimulation(data.simulation);
        setDebate(data.debate);
        setReport(data.report);
        if (data.pipelineSteps) setPipelineSteps(data.pipelineSteps);
        if (data.vtnSimTxUrl) setVtnSimTxUrl(data.vtnSimTxUrl);
        if (data.liveDebateMessages?.length > 0) setLiveDebateMessages(data.liveDebateMessages);
        setLoading(false);
        setRefreshing(false);
      })
      .catch(() => setRefreshing(false));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    fetchData();

    // Connect to SSE stream for real-time updates
    const eventSource = new EventSource('/api/cre-results/stream');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.proposalId === id || data.proposalId === proposal?.proposalId) {
          if (data.type === 'step_progress') {
            setPipelineSteps(prev => {
              if (!prev) return prev;
              return prev.map(s =>
                s.id === data.data?.stepId
                  ? { ...s, status: data.data.status, durationMs: data.data.durationMs, detail: data.data.detail }
                  : s
              );
            });
          }
          if (data.type === 'vtn_tx_url' && data.data?.url) {
            setVtnSimTxUrl(data.data.url);
          }
          if (data.type === 'debate_message_chunk' && data.data) {
            const chunk = data.data as IDebateMessage;
            setLiveDebateMessages(prev => {
              const idx = prev.findIndex(m => m.id === chunk.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = chunk;
                return updated;
              }
              return [...prev, chunk];
            });
          }
          if (data.type === 'debate_message' && data.data) {
            const msg = data.data as IDebateMessage;
            setLiveDebateMessages(prev => {
              const idx = prev.findIndex(m => m.id === msg.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...msg, streaming: false };
                return updated;
              }
              return [...prev, { ...msg, streaming: false }];
            });
          }
          fetchData();
        }
      } catch {}
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    // Also poll every 3 seconds as fallback if proposal is still being processed
    const interval = setInterval(() => {
      if (!loading && proposal?.status === 'debating') {
        fetchData();
      }
    }, 3000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, [id, loading, proposal?.status, proposal?.proposalId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-senate-bg dark:bg-dark-bg">
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 pt-24">
          <div className="skeleton h-10 w-80 rounded-lg mb-4" />
          <div className="skeleton h-6 w-96 rounded-lg mb-8" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 skeleton h-96 rounded-2xl" />
            <div className="skeleton h-96 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-senate-bg dark:bg-dark-bg">
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 pt-24 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Proposal Not Found</h1>
          <Link href="/proposals" className="text-senate-blue hover:underline">
            Back to proposals
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-senate-bg dark:bg-dark-bg">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-16">
        {/* Breadcrumb + Refresh */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
            <Link href="/proposals" className="hover:text-senate-blue transition-colors">
              Proposals
            </Link>
            <span>/</span>
            <span className="text-gray-600 dark:text-gray-300 truncate max-w-xs">{proposal.title}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh data"
            className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </button>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-senate-blue/10 px-3 py-1 text-xs font-semibold uppercase text-senate-blue">
              {proposal.protocol}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">#{proposal.proposalId}</span>
            {proposal.status === 'debating' && (
              <span className="rounded-full bg-orange-100 border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-700 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 pulse-live" />
                Live Analysis
              </span>
            )}
            {report && (
              <span className="rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                On-Chain Verified
              </span>
            )}
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{proposal.title}</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">{proposal.description}</p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Simulation Results */}
            {simulation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-senate-border dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100">
                      <svg className="h-3.5 w-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                      </svg>
                    </span>
                    Tenderly Simulation Results
                  </h3>
                  {simulation?.forkUrl && (
                    <a
                      href={simulation.forkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 transition-all hover:bg-amber-200 dark:hover:bg-amber-900/60"
                    >
                      View on Tenderly
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    { label: 'TVL Change', value: `${simulation.metrics.tvlChangePct > 0 ? '+' : ''}${simulation.metrics.tvlChangePct}%`, positive: simulation.metrics.tvlChangePct > 0 },
                    { label: 'Liquidation Risk', value: `${simulation.metrics.liquidationRisk}/100`, positive: simulation.metrics.liquidationRisk < 50 },
                    { label: 'Price Impact', value: `${simulation.metrics.priceImpactPct}%`, positive: simulation.metrics.priceImpactPct < 1 },
                    { label: 'Gas Used', value: simulation.metrics.gasUsed.toLocaleString(), positive: true },
                    { label: 'Affected Addrs', value: simulation.metrics.affectedAddresses.toLocaleString(), positive: true },
                    { label: 'Collateral Before', value: `${simulation.metrics.collateralRatioBefore}x`, positive: true },
                    { label: 'Collateral After', value: `${simulation.metrics.collateralRatioAfter}x`, positive: simulation.metrics.collateralRatioAfter >= 1.4 },
                    { label: 'State Changes', value: simulation.stateDiff?.length || 0, positive: true },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl bg-gray-50 dark:bg-dark-surface p-3 border border-gray-100 dark:border-dark-border">
                      <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{m.label}</p>
                      <p className={`text-sm font-bold tabular-nums ${m.positive ? 'text-gray-900 dark:text-white' : 'text-amber-600'}`}>
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Attack Pattern Alert */}
            {debate?.verdict?.attackMatches && debate.verdict.attackMatches.length > 0 && (
              <AttackPatternAlert matches={debate.verdict.attackMatches} />
            )}

            {/* Completed Debate */}
            {debate && (
              <DebateChat
                messages={debate.messages}
                verdict={debate.verdict}
              />
            )}

            {/* Pipeline steps (shown during processing and after completion) */}
            {pipelineSteps && pipelineSteps.length > 0 && (
              <PipelineSteps
                steps={pipelineSteps}
                tenderlyUrl={vtnSimTxUrl || simulation?.forkUrl}
                debateMessages={proposal.status !== 'complete' ? liveDebateMessages : debate?.messages}
                pipelineComplete={proposal.status === 'complete'}
              />
            )}

            {/* No debate yet - fallback when no pipeline data available */}
            {!debate && !pipelineSteps && proposal.status === 'debating' && (
              <div className="rounded-2xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-8 shadow-sm text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="h-2 w-2 rounded-full bg-orange-500 pulse-live" />
                  <p className="text-orange-700 dark:text-orange-400 font-semibold">AI Senate Analysis in Progress</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Simulating on Tenderly, running agent debate, and generating report...
                </p>
              </div>
            )}
            {!debate && proposal.status !== 'debating' && (
              <div className="rounded-2xl border border-senate-border dark:border-dark-border bg-white dark:bg-dark-card p-8 shadow-sm text-center">
                <p className="text-gray-400 dark:text-gray-500 mb-2">No debate data for this proposal yet</p>
                <Link href="/admin" className="text-sm font-medium text-senate-blue hover:underline">
                  Run a CRE workflow to generate debate data
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {debate?.verdict && (
              <div className="rounded-2xl border border-senate-border dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-sm">
                <RiskGauge score={debate.verdict.riskScore} size={140} />
                <div className="mt-4 space-y-2">
                  {debate.verdict.agentFinalPositions?.map((pos) => (
                    <div key={pos.agentId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AgentAvatar agentId={pos.agentId as SpeakerId} size="xs" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{pos.name}</span>
                      </div>
                      <span className={`text-xs font-bold ${
                        pos.finalVote === 'PASS' ? 'text-emerald-600' : pos.finalVote === 'FAIL' ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {pos.finalVote}
                        {pos.changedVote && <span className="ml-1 text-amber-500">*</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report && (
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  On-Chain Report
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">TX Hash</span>
                    <span className="font-mono text-senate-blue truncate ml-4 max-w-[140px]">{report.onChainTxHash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Content Hash</span>
                    <span className="font-mono text-gray-500 dark:text-gray-400 truncate ml-4 max-w-[140px]">{report.contentHash}</span>
                  </div>
                </div>
              </div>
            )}

            {report?.timing && (
              <div className="rounded-2xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                  <svg className="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pipeline Timing
                </h3>
                <div className="space-y-2 text-xs">
                  {report.timing.simulation && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Tenderly Simulation</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{(report.timing.simulation / 1000).toFixed(2)}s</span>
                    </div>
                  )}
                  {report.timing.debate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">AI Debate (Gemini)</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{(report.timing.debate / 1000).toFixed(2)}s</span>
                    </div>
                  )}
                  {report.timing.report && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">DON Report Generation</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{(report.timing.report / 1000).toFixed(2)}s</span>
                    </div>
                  )}
                  {report.timing.write && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">On-Chain Publishing</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{(report.timing.write / 1000).toFixed(2)}s</span>
                    </div>
                  )}
                  {report.timing.total && (
                    <div className="flex justify-between pt-2 mt-2 border-t border-orange-200 dark:border-orange-800">
                      <span className="text-gray-700 dark:text-gray-300 font-semibold">Total Pipeline</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">{(report.timing.total / 1000).toFixed(2)}s</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-senate-border dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Proposal Info</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-gray-500">Protocol</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{proposal.protocol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-gray-500">Governor</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300 truncate ml-2 max-w-[140px]" title={proposal.contractAddress}>
                    {proposal.contractAddress?.slice(0, 6)}...{proposal.contractAddress?.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-gray-500">Proposer</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">{proposal.proposer?.slice(0, 6)}...{proposal.proposer?.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-gray-500">Status</span>
                  <span className={`font-semibold capitalize ${proposal.status === 'complete' ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {proposal.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-gray-500">Block Range</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {proposal.startBlock?.toLocaleString()} → {proposal.endBlock?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {proposal.rawCalldata && (
              <details className="rounded-2xl border border-senate-border dark:border-dark-border bg-white dark:bg-dark-card shadow-sm overflow-hidden">
                <summary className="cursor-pointer px-5 py-3 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors flex items-center gap-2">
                  <svg className="h-4 w-4 text-orange-500 transition-transform details-open:rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  Executable Calldata
                </summary>
                <div className="border-t border-senate-border dark:border-dark-border px-5 py-4">
                  <pre className="rounded-xl bg-gray-950 p-4 font-mono text-[11px] leading-relaxed text-gray-300 overflow-x-auto whitespace-pre-wrap break-words">
                    {proposal.rawCalldata}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
