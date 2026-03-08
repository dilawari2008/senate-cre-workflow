'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { IProposal } from '@/types';

interface ProposalCardProps {
  proposal: IProposal;
  index: number;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
  simulating: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  debating: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
  complete: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  failed: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
};

const PROTOCOL_COLORS: Record<string, string> = {
  aave: 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
  compound: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
  uniswap: 'text-pink-700 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800',
};

export default function ProposalCard({ proposal, index }: ProposalCardProps) {
  const status = STATUS_STYLES[proposal.status] || STATUS_STYLES.pending;
  const protocolColor = PROTOCOL_COLORS[proposal.protocol] || 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Link
        href={`/proposals/${proposal.id}`}
        className="group block rounded-2xl border border-senate-border dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm transition-all hover:shadow-md hover:border-orange-500/20 dark:hover:border-orange-500/30"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${protocolColor}`}>
              {proposal.protocol}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">#{proposal.proposalId}</span>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ${status.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot} ${proposal.status === 'debating' ? 'pulse-live' : ''}`} />
            <span className={`text-[10px] font-medium capitalize ${status.text}`}>
              {proposal.status}
            </span>
          </div>
        </div>

        <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
          {proposal.title}
        </h3>

        <p className="mb-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">
          {proposal.description}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span className="font-mono">
            {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
          </span>
          <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
        </div>
      </Link>
    </motion.div>
  );
}
