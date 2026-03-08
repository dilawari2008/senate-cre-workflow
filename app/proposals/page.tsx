'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import ProposalCard from '../components/ProposalCard';
import { IProposal } from '@/types';

const PROTOCOLS = ['all', 'aave', 'compound', 'uniswap'];
const STATUSES = ['all', 'pending', 'simulating', 'debating', 'complete', 'failed'];

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<IProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [protocol, setProtocol] = useState('all');
  const [status, setStatus] = useState('all');

  const fetchProposals = () => {
    const params = new URLSearchParams();
    if (protocol !== 'all') params.set('protocol', protocol);
    if (status !== 'all') params.set('status', status);
    fetch(`/api/proposals?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProposals(data.proposals || []);
        setLoading(false);
        setRefreshing(false);
      })
      .catch(() => setRefreshing(false));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProposals();
  };

  useEffect(() => {
    fetchProposals();

    // SSE for real-time updates when new proposals arrive
    const eventSource = new EventSource('/api/cre-results/stream');
    eventSource.onmessage = () => { fetchProposals(); };
    eventSource.onerror = () => { eventSource.close(); };

    // Poll every 3 seconds as fallback (catches new proposals even without SSE)
    const interval = setInterval(fetchProposals, 3000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocol, status]);

  return (
    <div className="min-h-screen bg-senate-bg dark:bg-dark-bg">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Proposals</h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh proposals"
              className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface disabled:opacity-50"
            >
              <svg
                className={`h-4.5 w-4.5 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            </button>
          </div>
          <p className="mb-8 text-gray-500 dark:text-gray-400">
            Active and analyzed governance proposals across DeFi protocols
          </p>
        </motion.div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Protocol:</span>
            <div className="flex gap-1">
              {PROTOCOLS.map((p) => (
                <button
                  key={p}
                  onClick={() => setProtocol(p)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    protocol === p
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 border border-senate-border dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-surface'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status:</span>
            <div className="flex gap-1">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    status === s
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 border border-senate-border dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-surface'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-40 rounded-2xl" />
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-senate-border dark:border-dark-border bg-white dark:bg-dark-card py-20 shadow-sm">
            <p className="text-gray-400 dark:text-gray-500">No proposals found</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {proposals.map((p, i) => (
              <ProposalCard key={p.id} proposal={p} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
