'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import SenateLogo from '../components/SenateLogo';

interface CopyFieldProps {
  label: string;
  value: string;
  sublabel?: string;
  type?: 'address' | 'url' | 'text';
}

function getOpenUrl(value: string, type: CopyFieldProps['type']) {
  if (type === 'url') return value;
  if (type === 'address' && value.startsWith('0x') && !value.includes('DEPLOY')) {
    return `https://sepolia.etherscan.io/address/${value}`;
  }
  return null;
}

function CopyField({ label, value, sublabel, type = 'text' }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const openUrl = getOpenUrl(value, type);
  const isOpenable = type === 'url' || type === 'address';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
        {type === 'address' && (
          <span className="rounded bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 text-[10px] font-bold uppercase text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800">Contract</span>
        )}
        {type === 'url' && (
          <span className="rounded bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">Link</span>
        )}
      </div>
      {sublabel && <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">{sublabel}</p>}
      <div className="flex items-stretch gap-0">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            readOnly
            value={value}
            className={`w-full border border-r-0 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-surface px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-senate-blue focus:ring-1 focus:ring-senate-blue/20 transition-colors ${
              isOpenable ? 'rounded-l-xl' : 'rounded-l-xl'
            }`}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
        </div>
        <button
          onClick={handleCopy}
          title="Copy to clipboard"
          className={`flex items-center justify-center border border-r-0 px-3 py-3 transition-all ${
            copied
              ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
          } ${isOpenable && openUrl ? '' : 'rounded-r-xl border-r'}`}
        >
          {copied ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
            </svg>
          )}
        </button>
        {isOpenable && openUrl && (
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            className="flex items-center justify-center rounded-r-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card px-3 py-3 text-gray-400 dark:text-gray-500 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-orange-600 dark:hover:text-orange-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

const SECTIONS = [
  {
    title: 'Smart Contracts — Sepolia',
    description: 'Deployed on Sepolia testnet for CRE workflow writes',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    color: 'blue',
    fields: [
      {
        label: 'SenateReport.sol',
        sublabel: 'CRE consumer — receives DON-signed reports',
        value: process.env.NEXT_PUBLIC_SENATE_REPORT_SEPOLIA || '0x_DEPLOY_AND_PASTE_HERE',
        type: 'address' as const,
      },
      {
        label: 'AaveProposalMock.sol (SenateGovernor)',
        sublabel: 'Simulates Aave-style governance — emits ProposalCreated events that trigger the SENATE CRE pipeline',
        value: process.env.NEXT_PUBLIC_SENATE_GOVERNOR_SEPOLIA || '0x_DEPLOY_AND_PASTE_HERE',
        type: 'address' as const,
      },
      {
        label: 'SenateRiskOracle.sol',
        sublabel: 'On-chain risk oracle — isHighRisk() composable query',
        value: process.env.NEXT_PUBLIC_SENATE_RISK_ORACLE_SEPOLIA || '0x_DEPLOY_AND_PASTE_HERE',
        type: 'address' as const,
      },
      {
        label: 'Sepolia Etherscan',
        sublabel: 'Block explorer for deployed contracts',
        value: 'https://sepolia.etherscan.io',
        type: 'url' as const,
      },
    ],
  },
  {
    title: 'Smart Contracts — Tenderly VTN',
    description: 'Deployed on Tenderly Virtual TestNet for simulation & explorer visibility',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    color: 'emerald',
    fields: [
      {
        label: 'SenateReport.sol (VTN)',
        sublabel: 'Tenderly VTN deployment for explorer visibility',
        value: process.env.NEXT_PUBLIC_SENATE_REPORT_VTN || '0x_DEPLOY_AND_PASTE_HERE',
        type: 'address' as const,
      },
      {
        label: 'AaveProposalMock.sol (VTN)',
        sublabel: 'Simulates Aave-style governance on Tenderly VTN — triggers SENATE pipeline',
        value: process.env.NEXT_PUBLIC_SENATE_GOVERNOR_VTN || '0x_DEPLOY_AND_PASTE_HERE',
        type: 'address' as const,
      },
      {
        label: 'SenateRiskOracle.sol (VTN)',
        sublabel: 'Risk oracle on Tenderly VTN',
        value: process.env.NEXT_PUBLIC_SENATE_RISK_ORACLE_VTN || '0x_DEPLOY_AND_PASTE_HERE',
        type: 'address' as const,
      },
      {
        label: 'Tenderly VTN Explorer',
        sublabel: 'Public block explorer URL for judges',
        value: process.env.NEXT_PUBLIC_TENDERLY_EXPLORER || 'https://dashboard.tenderly.co',
        type: 'url' as const,
      },
      {
        label: 'Tenderly VTN RPC',
        sublabel: 'RPC endpoint for the Virtual TestNet',
        value: process.env.NEXT_PUBLIC_TENDERLY_VTN_RPC || 'https://virtual.mainnet.rpc.tenderly.co/...',
        type: 'url' as const,
      },
    ],
  },
  {
    title: 'Repository & Demo',
    description: 'GitHub repository and live demo links',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
    color: 'violet',
    fields: [
      {
        label: 'GitHub Repository',
        sublabel: 'Full source code — contracts, CRE workflow, frontend',
        value: process.env.NEXT_PUBLIC_GITHUB_REPO || 'https://github.com/YOUR_USERNAME/senate',
        type: 'url' as const,
      },
      {
        label: 'Live Demo URL',
        sublabel: 'Deployed application (Vercel)',
        value: process.env.NEXT_PUBLIC_DEMO_URL || 'https://senate-ai.vercel.app',
        type: 'url' as const,
      },
      {
        label: 'Demo Video',
        sublabel: 'Loom / YouTube walkthrough for judges',
        value: process.env.NEXT_PUBLIC_VIDEO_URL || 'https://www.loom.com/share/YOUR_VIDEO_ID',
        type: 'url' as const,
      },
    ],
  },
  {
    title: 'CRE Workflow Files',
    description: 'Chainlink Runtime Environment workflow paths for judges to review',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    color: 'amber',
    fields: [
      {
        label: 'CRE Workflow Entry',
        sublabel: 'senate-workflow/my-senate-workflow/main.ts',
        value: 'senate-workflow/my-senate-workflow/main.ts',
        type: 'text' as const,
      },
      {
        label: 'CRE Project Config',
        sublabel: 'senate-workflow/project.yaml',
        value: 'senate-workflow/project.yaml',
        type: 'text' as const,
      },
      {
        label: 'CRE Staging Config',
        sublabel: 'senate-workflow/config.staging.json',
        value: 'senate-workflow/config.staging.json',
        type: 'text' as const,
      },
      {
        label: 'Hardhat Deploy Script',
        sublabel: 'contracts/scripts/deploy-all.ts',
        value: 'contracts/scripts/deploy-all.ts',
        type: 'text' as const,
      },
    ],
  },
  {
    title: 'Hackathon Track Links',
    description: 'Direct links to the hackathon prize tracks SENATE targets',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
    color: 'rose',
    fields: [
      {
        label: 'CRE & AI Track ($17K)',
        sublabel: 'CRE orchestrates simulation + AI debate + on-chain report',
        value: 'https://chain.link/hackathon/prizes',
        type: 'url' as const,
      },
      {
        label: 'Risk & Compliance Track ($16K)',
        sublabel: 'SenateRiskOracle.sol — composable on-chain risk scoring',
        value: 'https://chain.link/hackathon/prizes',
        type: 'url' as const,
      },
      {
        label: 'Tenderly Virtual TestNets Track ($5K)',
        sublabel: 'Full VTN integration — fork, simulate, state diff, explorer',
        value: 'https://chain.link/hackathon/prizes',
        type: 'url' as const,
      },
    ],
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; icon: string; accent: string }> = {
  blue: { bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-200 dark:border-orange-800', icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400', accent: 'text-orange-600 dark:text-orange-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400', accent: 'text-emerald-600 dark:text-emerald-400' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-900/30', border: 'border-violet-200 dark:border-violet-800', icon: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400', accent: 'text-violet-600 dark:text-violet-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400', accent: 'text-amber-600 dark:text-amber-400' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-900/30', border: 'border-rose-200 dark:border-rose-800', icon: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400', accent: 'text-rose-600 dark:text-rose-400' },
};

export default function SubmissionPage() {
  const [copiedAll, setCopiedAll] = useState<string | null>(null);

  const handleCopyAll = async (sectionTitle: string, fields: typeof SECTIONS[0]['fields']) => {
    const text = fields.map((f) => `${f.label}: ${f.value}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedAll(sectionTitle);
    setTimeout(() => setCopiedAll(null), 2000);
  };

  return (
    <div className="min-h-screen bg-senate-bg dark:bg-dark-bg">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-center"
          >
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-senate-blue/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-senate-blue">
                Hackathon Submission
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              Contract Links & Resources
            </h1>
            <p className="mt-3 text-gray-500 dark:text-gray-400">
              All deployed contract addresses, repository links, and file paths needed
              for the Chainlink Convergence Hackathon submission. Click any field to select, or use the copy button.
            </p>
          </motion.div>

          {/* Sections */}
          <div className="space-y-8">
            {SECTIONS.map((section, sIdx) => {
              const colors = COLOR_MAP[section.color];
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: sIdx * 0.1 }}
                  className="rounded-2xl border border-senate-border dark:border-dark-border bg-white dark:bg-dark-card shadow-sm overflow-hidden"
                >
                  {/* Section header */}
                  <div className={`flex items-center justify-between border-b ${colors.border} ${colors.bg} px-6 py-4`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors.icon}`}>
                        {section.icon}
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">{section.title}</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{section.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyAll(section.title, section.fields)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        copiedAll === section.title
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {copiedAll === section.title ? (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          All Copied
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
                          </svg>
                          Copy All
                        </>
                      )}
                    </button>
                  </div>

                  {/* Fields */}
                  <div className="divide-y divide-gray-50 dark:divide-gray-700 px-6 py-4 space-y-5">
                    {section.fields.map((field) => (
                      <CopyField
                        key={field.label}
                        label={field.label}
                        value={field.value}
                        sublabel={field.sublabel}
                        type={field.type}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Quick Reference */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-10 rounded-2xl gradient-hero p-8 text-center"
          >
            <SenateLogo variant="dark" size="sm" />
            <p className="mt-4 text-sm text-orange-100/80">
              Replace placeholder values with your actual deployed contract addresses
              and links before submission. Set them as <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono">NEXT_PUBLIC_*</code> environment variables for automatic population.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
              <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-orange-200">CRE & AI Track</span>
              <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-emerald-200">Tenderly VTN Track</span>
              <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-violet-200">Risk & Compliance Track</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
