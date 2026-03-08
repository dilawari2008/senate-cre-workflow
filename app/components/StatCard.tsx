'use client';

import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
  delay?: number;
  accent?: 'blue' | 'green';
}

export default function StatCard({ label, value, change, icon, delay = 0, accent = 'blue' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl border border-senate-border dark:border-dark-border p-5 shadow-sm ${
        accent === 'green' ? 'gradient-card-green' : 'gradient-card-blue'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
          {change && (
            <p className={`mt-1 text-xs font-medium ${
              change.startsWith('+') ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            accent === 'green' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-senate-green dark:text-emerald-400' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
          }`}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
