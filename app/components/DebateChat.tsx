'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IDebateMessage, IVerdict, IAgentFinalPosition, AGENT_PROFILES, SpeakerId, DebatePhase, getAgentProfile, getDisplayName, getDisplayTitle, normalizeSpeakerId } from '@/types';
import AgentAvatar from './AgentAvatar';

interface DebateChatProps {
  messages: IDebateMessage[];
  verdict: IVerdict | null;
  animated?: boolean;
}

const PHASE_LABELS: Record<DebatePhase, string> = {
  opening: 'Opening Statements',
  review: 'Chairperson Review',
  counter: 'Counter-Arguments',
  verdict: 'Final Verdict',
};

const PHASE_ICONS: Record<DebatePhase, string> = {
  opening: '📢',
  review: '⚖️',
  counter: '🔄',
  verdict: '🏛️',
};

function ChatBubble({ msg, animated }: { msg: IDebateMessage; animated: boolean }) {
  const isLeft = msg.isChairperson || msg.speakerId === 'solomon';
  const profile = getAgentProfile(msg.speakerId);
  const hasVoteChange = msg.voteBefore !== undefined && msg.voteAfter !== undefined;

  const bubbleBg = isLeft
    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
    : msg.speakerId === 'caesar' ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
    : msg.speakerId === 'brutus' ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
    : msg.speakerId === 'cassius' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
    : 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800';

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
    >
      <div className="shrink-0 pt-1">
        <AgentAvatar agentId={normalizeSpeakerId(msg.speakerId)} size="sm" />
      </div>
      <div className={`max-w-[80%] rounded-2xl border p-4 ${bubbleBg}`}>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {getDisplayName(msg.speakerId, msg.speakerName)}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {getDisplayTitle(msg.speakerId, msg.speakerTitle)}
          </span>
          {msg.vote && (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              msg.vote === 'PASS' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
              : msg.vote === 'FAIL' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
            }`}>
              {msg.vote}
            </span>
          )}
          {hasVoteChange && (
            <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 animate-pulse">
              Changed: {msg.voteBefore} → {msg.voteAfter}
            </span>
          )}
        </div>
        <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">{msg.argument}</p>
        {msg.keyPoints && msg.keyPoints.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {msg.keyPoints.map((kp, i) => (
              <span key={i} className="rounded-full bg-white/70 dark:bg-dark-surface px-2 py-0.5 text-[10px] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-dark-border">
                {kp}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function FinalPositionCard({ position }: { position: IAgentFinalPosition }) {
  const profile = getAgentProfile(position.agentId);
  return (
    <div className="rounded-xl bg-white dark:bg-dark-card border border-senate-border dark:border-dark-border p-3 text-center shadow-sm">
      <AgentAvatar agentId={normalizeSpeakerId(position.agentId)} size="sm" className="justify-center mb-2" />
      <p className="text-xs font-semibold text-gray-900 dark:text-white">{position.name}</p>
      <p className={`text-sm font-bold mt-1 ${
        position.finalVote === 'PASS' ? 'text-emerald-600' : position.finalVote === 'FAIL' ? 'text-red-600' : 'text-gray-400'
      }`}>
        {position.finalVote}
      </p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{position.confidence}%</p>
      {position.changedVote && (
        <span className="mt-1 inline-block rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
          Changed from {position.voteBefore}
        </span>
      )}
    </div>
  );
}

export default function DebateChat({ messages, verdict, animated = false }: DebateChatProps) {
  const [showHistory, setShowHistory] = useState(false);

  const phases = ['opening', 'review', 'counter', 'verdict'] as DebatePhase[];
  const messagesByPhase = phases.reduce((acc, phase) => {
    acc[phase] = messages.filter((m) => m.phase === phase);
    return acc;
  }, {} as Record<DebatePhase, IDebateMessage[]>);

  return (
    <div className="space-y-6">
      {/* Angel's Verdict Card */}
      {verdict && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl border-2 p-6 shadow-sm ${
            verdict.recommendation === 'PASS'
              ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800'
              : 'border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AgentAvatar agentId="angel" size="lg" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Angel&apos;s Verdict</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">The Guardian — Chairperson</p>
              </div>
            </div>
            <span
              className={`rounded-full px-5 py-2 text-sm font-bold ${
                verdict.recommendation === 'PASS'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {verdict.recommendation}
            </span>
          </div>
          <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">{verdict.summary}</p>

          {/* Final Agent Positions */}
          {verdict.agentFinalPositions && verdict.agentFinalPositions.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {verdict.agentFinalPositions.map((pos) => (
                <FinalPositionCard key={pos.agentId} position={pos} />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Collapsed Debate History */}
      {messages.length > 0 && (
        <div className="rounded-2xl border border-senate-border dark:border-dark-border bg-white dark:bg-dark-card shadow-sm overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className={`h-4 w-4 text-gray-400 transition-transform ${showHistory ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Full Debate History
              </span>
              <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                {messages.length} messages
              </span>
            </div>
            <div className="flex gap-1">
              {phases.filter((p) => messagesByPhase[p].length > 0).map((phase) => (
                <span key={phase} className="text-xs" title={PHASE_LABELS[phase]}>
                  {PHASE_ICONS[phase]}
                </span>
              ))}
            </div>
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="border-t border-senate-border dark:border-dark-border p-4 space-y-6">
                  {phases.map((phase) => {
                    const phaseMessages = messagesByPhase[phase];
                    if (phaseMessages.length === 0) return null;
                    return (
                      <div key={phase}>
                        <div className="mb-3 flex items-center gap-2">
                          <span className="text-sm">{PHASE_ICONS[phase]}</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            {PHASE_LABELS[phase]}
                          </span>
                          <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
                        </div>
                        <div className="space-y-3">
                          {phaseMessages.map((m, idx) => (
                            <ChatBubble key={`${m.id}-${phase}-${idx}`} msg={m} animated={animated} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
