'use client';

import { motion } from 'framer-motion';

interface PipelineStep {
  step: number;
  label: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

interface PipelineStepperProps {
  steps: PipelineStep[];
  currentStep: number;
}

export default function PipelineStepper({ steps, currentStep }: PipelineStepperProps) {
  return (
    <div className="space-y-1">
      {steps.map((s, i) => {
        const isActive = s.step === currentStep;
        const isDone = s.status === 'complete';
        const isError = s.status === 'error';

        return (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
              isActive ? 'bg-orange-50 dark:bg-orange-950/40' : ''
            }`}
          >
            <div className="relative flex-shrink-0">
              {isDone ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : isError ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                  <svg className="h-3.5 w-3.5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              ) : isActive ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
                  <motion.div
                    className="h-2.5 w-2.5 rounded-full bg-orange-600"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{s.step}</span>
                </div>
              )}
              {i < steps.length - 1 && (
                <div
                  className={`absolute left-1/2 top-6 h-4 w-px -translate-x-1/2 ${
                    isDone ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>

            <span
              className={`text-sm ${
                isActive
                  ? 'font-medium text-orange-600 dark:text-orange-400'
                  : isDone
                    ? 'text-gray-600 dark:text-gray-400'
                    : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {s.label}
            </span>

            {isActive && s.status === 'running' && (
              <motion.div
                className="ml-auto flex gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[0, 1, 2].map((d) => (
                  <motion.div
                    key={d}
                    className="h-1 w-1 rounded-full bg-orange-600"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: d * 0.15 }}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
