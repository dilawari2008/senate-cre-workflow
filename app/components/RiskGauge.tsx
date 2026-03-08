'use client';

import { motion } from 'framer-motion';

interface RiskGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

export default function RiskGauge({ score, size = 120, label = 'Risk Score' }: RiskGaugeProps) {
  const radius = (size - 16) / 2;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s <= 30) return { stroke: '#059669', text: 'text-emerald-700 dark:text-emerald-400', label: 'Low Risk' };
    if (s <= 60) return { stroke: '#D97706', text: 'text-amber-700 dark:text-amber-400', label: 'Medium Risk' };
    if (s <= 80) return { stroke: '#EA580C', text: 'text-orange-700 dark:text-orange-400', label: 'High Risk' };
    return { stroke: '#DC2626', text: 'text-red-700 dark:text-red-400', label: 'Critical' };
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size / 2 + 16 }}>
        <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
          <path
            d={`M 8 ${size / 2 + 8} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2 + 8}`}
            fill="none"
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-700"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <motion.path
            d={`M 8 ${size / 2 + 8} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2 + 8}`}
            fill="none"
            stroke={color.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <motion.span
            className={`text-2xl font-bold tabular-nums ${color.text}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
        <p className={`text-xs font-semibold ${color.text}`}>{color.label}</p>
      </div>
    </div>
  );
}
