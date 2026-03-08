'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { IAttackMatch } from '@/types';
import { useState } from 'react';

interface AttackPatternAlertProps {
  matches: IAttackMatch[];
  animated?: boolean;
}

function getSeverityColor(similarity: number) {
  if (similarity >= 60) return { bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-300 dark:border-red-800', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-600', label: 'HIGH' };
  if (similarity >= 35) return { bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-300 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-600', label: 'MEDIUM' };
  return { bg: 'bg-yellow-50 dark:bg-yellow-950/40', border: 'border-yellow-300 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-400', badge: 'bg-yellow-600', label: 'LOW' };
}

export default function AttackPatternAlert({ matches, animated = false }: AttackPatternAlertProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (matches.length === 0) return null;

  const maxSeverity = Math.max(...matches.map((m) => m.similarity));
  const headerColor = getSeverityColor(maxSeverity);

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20, scale: 0.98 } : undefined}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl border-2 ${headerColor.border} ${headerColor.bg} p-5 shadow-sm`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/50">
            <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Historical Attack Pattern Alert
            </h3>
            <p className={`text-xs ${headerColor.text}`}>
              {matches.length} pattern{matches.length > 1 ? 's' : ''} matched from known governance attacks
            </p>
          </div>
        </div>
        <span className={`rounded-full ${headerColor.badge} px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider`}>
          {headerColor.label} RISK
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {matches.map((match, i) => {
            const severity = getSeverityColor(match.similarity);
            const isExpanded = expanded === match.patternId;

            return (
              <motion.div
                key={match.patternId}
                initial={animated ? { opacity: 0, x: -10 } : undefined}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: animated ? i * 0.15 : 0, duration: 0.3 }}
                className={`rounded-xl border ${severity.border} ${severity.bg} overflow-hidden`}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : match.patternId)}
                  className="w-full p-3.5 text-left transition-colors hover:bg-white/30 dark:hover:bg-white/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded-full ${severity.badge} px-2 py-0.5 text-[9px] font-bold text-white`}>
                          {match.similarity}% match
                        </span>
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                          {match.historicalLoss}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {match.name}
                      </p>
                    </div>
                    <svg
                      className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3.5 pb-3.5 space-y-3">
                        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                          {match.description}
                        </p>

                        <div>
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Matching Indicators
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {match.indicators.map((indicator, j) => (
                              <span
                                key={j}
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${severity.border} ${severity.text}`}
                              >
                                {indicator}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
