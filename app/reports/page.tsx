'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import RiskGauge from '../components/RiskGauge';
import { ISenateReport } from '@/types';

const PAGE_SIZE = 6;

export default function ReportsPage() {
  const [reports, setReports] = useState<ISenateReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = () => {
    fetch('/api/reports')
      .then((r) => r.json())
      .then((data) => {
        setReports(data.reports || []);
        setLoading(false);
        setRefreshing(false);
      })
      .catch(() => setRefreshing(false));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const totalPages = Math.ceil(reports.length / PAGE_SIZE);
  const pagedReports = reports.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-senate-bg dark:bg-dark-bg">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">On-Chain Reports</h1>
            <button
              onClick={() => { setRefreshing(true); fetchReports(); }}
              disabled={refreshing}
              title="Refresh reports"
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
            DON-verified governance analysis reports published via Chainlink CRE
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-56 rounded-2xl" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-senate-border dark:border-dark-border bg-white dark:bg-dark-card py-20 shadow-sm">
            <p className="text-gray-400 dark:text-gray-500 mb-4">No reports published yet</p>
            <Link href="/admin" className="text-sm font-medium text-senate-blue hover:underline">
              Run a pipeline to generate a report
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pagedReports.map((report, i) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/proposals/${report.proposalId}`}
                    className="block rounded-2xl border border-senate-border dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-700 transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="rounded-full bg-emerald-100 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        On-Chain
                      </span>
                      <span className="rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-[9px] font-bold uppercase text-orange-700 dark:text-orange-400 tracking-wider">
                        {report.report.protocol}
                      </span>
                      <span className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        report.report.recommendation === 'PASS'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {report.report.recommendation}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2 mb-3 min-h-[2.5rem]">
                      {report.report.title}
                    </h3>

                    <div className="flex items-center justify-between">
                      <RiskGauge score={report.report.riskScore} size={60} />
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Risk Score</p>
                        <p className={`text-lg font-bold tabular-nums ${
                          report.report.riskScore > 60 ? 'text-red-600' : report.report.riskScore > 30 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {report.report.riskScore}/100
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-400 dark:text-gray-500 font-mono truncate max-w-[60%]" title={report.onChainTxHash}>
                          TX: {report.onChainTxHash?.slice(0, 10)}...{report.onChainTxHash?.slice(-6)}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500">Block {report.blockNumber?.toLocaleString()}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      page === i
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-surface'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
