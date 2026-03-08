'use client';

import { motion } from 'framer-motion';
import { IDebateMessage, AGENT_PROFILES, SpeakerId, getAgentProfile, normalizeSpeakerId, getDisplayName, getDisplayTitle } from '@/types';
import { useState, useEffect } from 'react';
import AgentAvatar from './AgentAvatar';

interface AgentBubbleProps {
  message: IDebateMessage;
  index: number;
  animated?: boolean;
}

const SPEAKER_THEME: Record<string, { bg: string; border: string; badge: string; name: string }> = {
  angel: {
    bg: 'bg-amber-50/50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400',
    name: 'text-amber-800 dark:text-amber-400',
  },
  caesar: {
    bg: 'bg-orange-50/50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400',
    name: 'text-orange-800 dark:text-orange-400',
  },
  brutus: {
    bg: 'bg-red-50/50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400',
    name: 'text-red-800 dark:text-red-400',
  },
  cassius: {
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400',
    name: 'text-emerald-800 dark:text-emerald-400',
  },
  portia: {
    bg: 'bg-violet-50/50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
    badge: 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-400',
    name: 'text-violet-800 dark:text-violet-400',
  },
};

export default function AgentBubble({ message, index, animated = false }: AgentBubbleProps) {
  const normalId = normalizeSpeakerId(message.speakerId);
  const profile = getAgentProfile(message.speakerId);
  const theme = SPEAKER_THEME[normalId] || SPEAKER_THEME.angel;
  const [displayedText, setDisplayedText] = useState(animated ? '' : message.argument);
  const [isTyping, setIsTyping] = useState(animated);

  useEffect(() => {
    if (!animated) return;
    let i = 0;
    const text = message.argument;
    const interval = setInterval(() => {
      i += 3;
      if (i >= text.length) {
        setDisplayedText(text);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setDisplayedText(text.slice(0, i));
      }
    }, 16);
    return () => clearInterval(interval);
  }, [animated, message.argument]);

  const voteColor =
    message.vote === 'PASS'
      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700'
      : message.vote === 'FAIL'
        ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';

  const hasVoteChange = message.voteBefore !== undefined && message.voteAfter !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.4 }}
      className={`rounded-2xl border ${theme.border} ${theme.bg} p-5`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <AgentAvatar agentId={normalId} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${theme.name}`}>{getDisplayName(message.speakerId, message.speakerName)}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${theme.badge}`}>
                {getDisplayTitle(message.speakerId, message.speakerTitle)}
              </span>
              {message.phase !== 'opening' && (
                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[9px] font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {message.phase}
                </span>
              )}
            </div>
            {profile?.catchphrase && (
              <p className="mt-0.5 text-xs italic text-gray-400 dark:text-gray-500">
                &ldquo;{profile.catchphrase.slice(0, 60)}...&rdquo;
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasVoteChange && (
            <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 px-2 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-400">
              {message.voteBefore} → {message.voteAfter}
            </span>
          )}
          {message.vote && (
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${voteColor}`}>
              {message.vote}
            </span>
          )}
          {message.confidence !== undefined && (
            <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
              {message.confidence}%
            </span>
          )}
        </div>
      </div>

      <div className="mb-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        {displayedText}
        {isTyping && <span className="typewriter-cursor" />}
      </div>

      {message.keyPoints && message.keyPoints.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {message.keyPoints.map((point, i) => (
            <span
              key={i}
              className="rounded-full bg-white dark:bg-dark-surface px-2.5 py-1 text-xs text-gray-600 dark:text-gray-400 border border-senate-border dark:border-dark-border shadow-sm"
            >
              {point}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
