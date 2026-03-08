'use client';

import Image from 'next/image';
import { SpeakerId, AGENT_PROFILES } from '@/types';

const AVATAR_PATHS: Record<string, string> = {
  caesar: '/agents/caesar.png',
  brutus: '/agents/brutus.png',
  cassius: '/agents/cassius.png',
  portia: '/agents/portia.png',
};

const RING_COLORS: Record<string, string> = {
  angel: 'ring-amber-400',
  solomon: 'ring-amber-400',
  caesar: 'ring-orange-400',
  brutus: 'ring-red-400',
  cassius: 'ring-emerald-400',
  portia: 'ring-violet-400',
};

interface AgentAvatarProps {
  agentId: SpeakerId | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showTitle?: boolean;
  ring?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: { container: 'h-6 w-6', image: 24, text: 'text-[10px]', title: 'text-[9px]', icon: 'text-sm' },
  sm: { container: 'h-8 w-8', image: 32, text: 'text-xs', title: 'text-[10px]', icon: 'text-lg' },
  md: { container: 'h-10 w-10', image: 40, text: 'text-sm', title: 'text-xs', icon: 'text-xl' },
  lg: { container: 'h-14 w-14', image: 56, text: 'text-base', title: 'text-sm', icon: 'text-3xl' },
  xl: { container: 'h-20 w-20', image: 80, text: 'text-lg', title: 'text-sm', icon: 'text-4xl' },
};

export default function AgentAvatar({
  agentId,
  size = 'md',
  showName = false,
  showTitle = false,
  ring = true,
  className = '',
}: AgentAvatarProps) {
  const agent = AGENT_PROFILES[agentId as SpeakerId];
  const s = SIZE_MAP[size];
  const isAngel = agentId === 'angel' || agentId === 'solomon';
  const hasImage = AVATAR_PATHS[agentId];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`relative ${s.container} shrink-0 overflow-hidden rounded-full ${ring ? `ring-2 ${RING_COLORS[agentId] || 'ring-gray-400'}` : ''}`}>
        {isAngel ? (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 ${s.icon}`}>
            <span role="img" aria-label="Angel">🧙‍♂️</span>
          </div>
        ) : hasImage ? (
          <Image
            src={AVATAR_PATHS[agentId]}
            alt={agent?.name || agentId}
            width={s.image}
            height={s.image}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700 ${s.icon}`}>
            <span>{(agent?.name || agentId)[0]?.toUpperCase()}</span>
          </div>
        )}
      </div>
      {(showName || showTitle) && agent && (
        <div className="min-w-0">
          {showName && (
            <p className={`font-semibold text-gray-900 dark:text-gray-100 ${s.text} leading-tight`}>{agent.name}</p>
          )}
          {showTitle && (
            <p className={`text-gray-500 dark:text-gray-400 ${s.title} leading-tight`}>{agent.title}</p>
          )}
        </div>
      )}
    </div>
  );
}
