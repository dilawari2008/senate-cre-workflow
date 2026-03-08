'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { IDebateMessage } from '@/types';
import AgentAvatar from './AgentAvatar';
import { SpeakerId } from '@/types';

export type StepStatus = 'pending' | 'running' | 'complete' | 'failed';

export interface PipelineStepData {
  id: string;
  label: string;
  status: StepStatus;
  durationMs?: number;
  detail?: string;
}

interface PipelineStepsProps {
  steps: PipelineStepData[];
  tenderlyUrl?: string;
  debateMessages?: IDebateMessage[];
  pipelineComplete?: boolean;
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'complete') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30"
      >
        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </motion.div>
    );
  }
  if (status === 'running') {
    return (
      <div className="relative flex h-7 w-7 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
        <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 shadow-lg shadow-orange-500/30">
          <svg className="h-3.5 w-3.5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/30">
        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
      <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
    </div>
  );
}

const STEP_ICONS: Record<string, string> = {
  proposal_submitted: '📋',
  tenderly_simulation: '🔬',
  attack_scan: '🛡️',
  ai_debate: '🏛️',
  senate_verdict: '⚖️',
  don_report: '📜',
  onchain_publish: '⛓️',
  webhook: '🔔',
  complete: '✅',
};

function TypingCursor() {
  return (
    <span className="inline-block w-1.5 h-3 bg-orange-500 dark:bg-orange-400 animate-pulse rounded-sm ml-0.5 align-middle" />
  );
}

function InlineDebatePreview({ messages }: { messages: IDebateMessage[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollRef} className="mt-2 space-y-1.5 max-h-72 overflow-y-auto pr-1 scroll-smooth">
      {messages.map((msg, idx) => {
        const isStreaming = msg.streaming;
        const hasContent = msg.argument && msg.argument.length > 0;

        return (
          <motion.div
            key={msg.id || idx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={`flex items-start gap-2 rounded-lg p-2 border transition-colors ${
              isStreaming
                ? 'bg-orange-50/80 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
                : 'bg-white/60 dark:bg-dark-surface/60 border-gray-100 dark:border-dark-border'
            }`}
          >
            <AgentAvatar agentId={msg.speakerId as SpeakerId} size="xs" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{msg.speakerName}</span>
                {isStreaming && (
                  <span className="flex items-center gap-0.5">
                    <span className="h-1 w-1 rounded-full bg-orange-500 animate-pulse" />
                    <span className="h-1 w-1 rounded-full bg-orange-500 animate-pulse [animation-delay:150ms]" />
                    <span className="h-1 w-1 rounded-full bg-orange-500 animate-pulse [animation-delay:300ms]" />
                  </span>
                )}
                {!isStreaming && msg.vote && (
                  <span className={`text-[9px] font-bold px-1 rounded ${
                    msg.vote === 'PASS' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                    msg.vote === 'FAIL' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                    'bg-gray-100 text-gray-600'
                  }`}>{msg.vote}</span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                {hasContent ? msg.argument : null}
                {isStreaming && hasContent && <TypingCursor />}
                {isStreaming && !hasContent && (
                  <span className="italic text-orange-500/70 dark:text-orange-400/50">thinking...</span>
                )}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function PipelineSteps({ steps, tenderlyUrl, debateMessages, pipelineComplete }: PipelineStepsProps) {
  const [elapsed, setElapsed] = useState(0);
  const allComplete = steps.every(s => s.status === 'complete');
  const debateStep = steps.find(s => s.id === 'ai_debate');
  const debateRunning = debateStep?.status === 'running';
  const debateComplete = debateStep?.status === 'complete';

  useEffect(() => {
    if (allComplete) return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [allComplete]);

  // Show debate chat during processing only; hide once pipeline completes (full history is in DebateChat)
  const showInlineDebate = debateMessages && debateMessages.length > 0 && !pipelineComplete && (debateRunning || debateComplete);

  return (
    <div className="rounded-2xl border border-orange-200 dark:border-orange-800 bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/20 dark:to-dark-card p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/50">
            <svg className="h-3.5 w-3.5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </span>
          SENATE Pipeline
        </h3>
        {!allComplete && (
          <span className="flex items-center gap-1.5 rounded-full bg-orange-100 dark:bg-orange-900/40 px-3 py-1 text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
            Processing {elapsed}s
          </span>
        )}
        {allComplete && (
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Complete
          </span>
        )}
      </div>

      <div className="relative">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const showTenderlyLink = step.id === 'tenderly_simulation' && step.status === 'complete' && tenderlyUrl;
          const showDebateInline = step.id === 'ai_debate' && showInlineDebate;

          return (
            <div key={step.id} className="relative flex gap-4">
              {!isLast && (
                <div className="absolute left-[13px] top-7 bottom-0 w-0.5">
                  <div
                    className={`h-full w-full transition-colors duration-500 ${
                      step.status === 'complete'
                        ? 'bg-emerald-400 dark:bg-emerald-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                </div>
              )}

              <div className="relative z-10 flex-shrink-0">
                <StepIcon status={step.status} />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${step.id}-${step.status}`}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex-1 pb-5 ${isLast ? 'pb-0' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {STEP_ICONS[step.id] || '⚡'}
                    </span>
                    <span
                      className={`text-sm font-semibold transition-colors ${
                        step.status === 'complete'
                          ? 'text-gray-900 dark:text-white'
                          : step.status === 'running'
                          ? 'text-orange-700 dark:text-orange-400'
                          : 'text-gray-400 dark:text-gray-600'
                      }`}
                    >
                      {step.label}
                    </span>
                    {step.durationMs != null && step.status === 'complete' && (
                      <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-mono text-gray-500 dark:text-gray-400">
                        {(step.durationMs / 1000).toFixed(2)}s
                      </span>
                    )}
                  </div>
                  {step.status === 'running' && step.detail && (
                    <p className="mt-0.5 text-xs text-orange-600/70 dark:text-orange-400/60 italic">
                      {step.detail}
                    </p>
                  )}
                  {showTenderlyLink && (
                    <a
                      href={tenderlyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      View TX on Tenderly VTN
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  )}
                  {showDebateInline && (
                    <InlineDebatePreview messages={debateMessages!} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
