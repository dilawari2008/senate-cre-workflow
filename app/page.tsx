'use client';

import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import Navbar from './components/Navbar';
import StatCard from './components/StatCard';
import RiskGauge from './components/RiskGauge';
import ProposalCard from './components/ProposalCard';
import SenateLogo from './components/SenateLogo';
import AgentAvatar from './components/AgentAvatar';
import { useTheme } from './components/ThemeProvider';
import { useEffect, useState, useRef } from 'react';
import { IProposal, AGENT_PROFILES, DEBATE_AGENTS, AgentId, SpeakerId } from '@/types';

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = Math.ceil(value / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return <span ref={ref}>{display}{suffix}</span>;
}

function ScrollSection({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const PARTNER_LOGOS = [
  { name: 'Chainlink', abbr: 'CL' },
  { name: 'Tenderly', abbr: 'TN' },
  { name: 'Ethereum', abbr: 'ETH' },
  { name: 'Gemini', abbr: 'GM' },
  { name: 'Aave', abbr: 'AA' },
  { name: 'Compound', abbr: 'CP' },
  { name: 'Uniswap', abbr: 'UNI' },
  { name: 'OpenZeppelin', abbr: 'OZ' },
  { name: 'Hardhat', abbr: 'HH' },
  { name: 'Vercel', abbr: 'VC' },
];

const HOW_IT_WORKS = [
  {
    label: 'TENDERLY SIMULATION',
    title: 'Fork mainnet. Simulate. Extract state diffs.',
    desc: 'Every proposal is simulated on a Tenderly Virtual TestNet fork of Ethereum mainnet. Real DeFi state, real liquidity, real impact.',
    color: 'from-emerald-500 to-emerald-700',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    label: 'AI AGENT DEBATE',
    title: '4 senators + 1 chairperson. Every angle.',
    desc: 'Caesar (Bull), Brutus (Bear), Cassius (Quant), and Portia (Defender) debate while Angel (The Guardian) moderates and delivers the final verdict.',
    color: 'from-orange-500 to-orange-700',
    bgLight: 'bg-orange-50 dark:bg-orange-950/40',
    textColor: 'text-orange-700 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  {
    label: 'ON-CHAIN REPORT',
    title: 'DON-signed. Immutable. Verifiable.',
    desc: 'The verdict is cryptographically signed by the Chainlink DON and written to SenateReport.sol on Sepolia — permanently on-chain.',
    color: 'from-amber-500 to-amber-700',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
];

const FEATURES = [
  { id: 'simulation', label: 'Simulation', title: 'Real DeFi state, not toy data', desc: 'Tenderly Virtual TestNets fork Ethereum mainnet at the latest block, preserving real Aave pools, Compound markets, and Uniswap liquidity. Every simulation runs against production state.', bullets: ['Mainnet state preservation', 'Full state diff extraction', 'Public explorer for judges'], accent: 'emerald' },
  { id: 'debate', label: 'AI Debate', title: 'Adversarial analysis, not echo chambers', desc: 'Four AI agents with distinct mandates debate each proposal. Bull vs Bear vs Quant vs Defender ensures every angle is covered before a verdict.', bullets: ['Confidence-weighted voting', 'Cross-agent rebuttals', 'Real-time SSE streaming'], accent: 'orange' },
  { id: 'onchain', label: 'On-Chain', title: 'Verdicts you can verify, not just trust', desc: 'CRE orchestrates the full pipeline — simulation, debates, verdict computation — then publishes a DON-signed report to SenateReport.sol on Sepolia.', bullets: ['DON-signed reports', 'Etherscan verifiable', 'Composable risk oracle'], accent: 'amber' },
  { id: 'risk', label: 'Risk Oracle', title: 'Automated protocol safeguard triggers', desc: 'SenateRiskOracle.sol tracks per-protocol risk scores over time. Other contracts can query isHighRisk() before executing governance actions.', bullets: ['Threshold breach alerts', 'Per-protocol tracking', 'Composable DeFi integration'], accent: 'amber' },
];

const ACCENT_STYLES: Record<string, { pill: string; bullet: string; border: string }> = {
  emerald: { pill: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400', bullet: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800' },
  orange: { pill: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400', bullet: 'bg-orange-500', border: 'border-orange-200 dark:border-orange-800' },
  amber: { pill: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400', bullet: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-800' },
};

const ROLES = [
  { title: 'DAO DELEGATES', subtitle: 'Your time is limited. Let Senate do the research.', desc: 'Get simulation-backed, multi-perspective analysis for every proposal before you cast your vote. No more blindly following forum posts.' },
  { title: 'PROTOCOL TEAMS', subtitle: 'Your governance is your moat.', desc: 'Monitor every parameter change. SenateRiskOracle flags dangerous proposals before they pass, acting as an automated safety net for your protocol.' },
  { title: 'RISK ANALYSTS', subtitle: 'Your models need real data.', desc: 'Tenderly simulation metrics + 4-agent adversarial analysis gives you quantitative risk scores backed by mainnet state, not assumptions.' },
  { title: 'SECURITY RESEARCHERS', subtitle: 'You find the exploits others miss.', desc: 'Every proposal is simulated against real state. Brutus (The Bear) specifically scrutinizes for attack vectors, cascading failures, and historical parallels.' },
];

export default function Dashboard() {
  const [proposals, setProposals] = useState<IProposal[]>([]);
  const [stats, setStats] = useState({ totalAnalyzed: 0, totalReports: 0, passRate: 0, avgRiskScore: 0, protocolsSupported: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFeature, setActiveFeature] = useState('simulation');
  const [activeRole, setActiveRole] = useState(0);
  const { theme } = useTheme();

  useEffect(() => {
    Promise.all([
      fetch('/api/proposals').then((r) => r.json()),
      fetch('/api/stats').then((r) => r.json()),
    ]).then(([proposalData, statsData]) => {
      setProposals(proposalData.proposals || []);
      setStats(statsData);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => {
        const idx = FEATURES.findIndex((f) => f.id === prev);
        return FEATURES[(idx + 1) % FEATURES.length].id;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveRole((prev) => (prev + 1) % ROLES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const currentFeature = FEATURES.find((f) => f.id === activeFeature) || FEATURES[0];
  const featureStyle = ACCENT_STYLES[currentFeature.accent];

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      <Navbar />

      {/* HERO */}
      <section className="gradient-hero pt-28 pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center">
            <div className="mb-6 flex items-center justify-center gap-3">
              <span className="rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-medium text-orange-200 backdrop-blur-sm">Chainlink CRE Powered</span>
              <span className="rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-medium text-emerald-200 backdrop-blur-sm">Tenderly VTN Verified</span>
            </div>
            <h1 className="mb-5 text-5xl font-bold tracking-tight text-white leading-tight md:text-6xl lg:text-7xl">
              AI-Powered Governance<br />
              <span className="bg-gradient-to-r from-orange-300 via-amber-200 to-orange-300 bg-clip-text text-transparent">Intelligence for DeFi</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-orange-100/80 leading-relaxed">
              4 AI senators debate every governance proposal using real Tenderly simulation data, then publish a DON-verified verdict on-chain.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-orange-800 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
                Launch Live Demo
              </Link>
              <Link href="/proposals" className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
                View Proposals &rarr;
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* LOGO MARQUEE */}
      <section className="border-b border-senate-border dark:border-dark-border bg-white dark:bg-dark-bg py-8 overflow-hidden">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Powered by leaders in Web3 & AI</p>
        <div className="relative">
          <div className="flex marquee whitespace-nowrap">
            {[...PARTNER_LOGOS, ...PARTNER_LOGOS].map((logo, i) => (
              <div key={`${logo.name}-${i}`} className="mx-8 flex items-center gap-2 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-surface text-[10px] font-bold text-gray-400 dark:text-gray-500">{logo.abbr}</div>
                <span className="text-sm font-semibold tracking-wide">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="gradient-section py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Proposals Analyzed" value={stats.totalAnalyzed} delay={0.1} accent="blue" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>} />
            <StatCard label="On-Chain Reports" value={stats.totalReports} delay={0.2} accent="green" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>} />
            <StatCard label="Pass Rate" value={`${stats.passRate}%`} delay={0.3} accent="blue" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>} />
            <StatCard label="Avg Risk Score" value={stats.avgRiskScore} delay={0.4} accent="green" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>} />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white dark:bg-dark-bg py-24">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollSection>
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">How SENATE Works</p>
            <h2 className="mb-4 text-center text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Three steps. Zero blind spots.</h2>
            <p className="mx-auto mb-16 max-w-xl text-center text-gray-500 dark:text-gray-400">Every governance proposal goes through simulation, adversarial debate, and on-chain verification before a verdict is issued.</p>
          </ScrollSection>
          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <ScrollSection key={step.label} delay={i * 0.15}>
                <div className={`group rounded-2xl border ${step.borderColor} ${step.bgLight} p-8 transition-all hover:shadow-lg hover:-translate-y-1`}>
                  <span className={`inline-block rounded-full ${step.bgLight} border ${step.borderColor} px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${step.textColor} mb-4`}>{step.label}</span>
                  <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{step.desc}</p>
                  <div className={`mt-6 h-1 w-12 rounded-full bg-gradient-to-r ${step.color} transition-all group-hover:w-20`} />
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* BIG METRICS */}
      <section className="gradient-hero py-20">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollSection><h2 className="mb-16 text-center text-3xl font-bold text-white">Results that speak for themselves</h2></ScrollSection>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: 38, suffix: '/100', label: 'Avg Risk Score', sub: 'Across all analyzed proposals' },
              { value: 100, suffix: '%', label: 'Pass Rate', sub: 'Community-aligned verdicts' },
              { value: 5, suffix: '', label: 'AI Agents', sub: '4 senators + 1 chairperson' },
              { value: 3, suffix: '', label: 'DeFi Protocols', sub: 'Aave, Compound, Uniswap' },
            ].map((metric, i) => (
              <ScrollSection key={metric.label} delay={i * 0.1}>
                <div className="text-center">
                  <p className="text-5xl font-bold text-white md:text-6xl"><AnimatedNumber value={metric.value} suffix={metric.suffix} /></p>
                  <p className="mt-2 text-sm font-semibold text-orange-200">{metric.label}</p>
                  <p className="mt-1 text-xs text-orange-300/60">{metric.sub}</p>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE TABS */}
      <section className="bg-white dark:bg-dark-bg py-24">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollSection>
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-senate-green dark:text-emerald-400">Platform Capabilities</p>
            <h2 className="mb-4 text-center text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Your governance stack, but smarter.</h2>
            <p className="mx-auto mb-12 max-w-xl text-center text-gray-500 dark:text-gray-400">Senate adds an intelligence layer to governance. Each capability is built for production use and hackathon-ready from day one.</p>
          </ScrollSection>
          <div className="mb-10 flex justify-center gap-2">
            {FEATURES.map((f) => {
              const isActive = f.id === activeFeature;
              const style = ACCENT_STYLES[f.accent];
              return (
                <button key={f.id} onClick={() => setActiveFeature(f.id)} className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${isActive ? `${style.pill} shadow-sm` : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface'}`}>{f.label}</button>
              );
            })}
          </div>
          <motion.div key={activeFeature} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className={`rounded-2xl border ${featureStyle.border} bg-white dark:bg-dark-card p-10 shadow-sm`}>
            <div className="grid gap-10 md:grid-cols-2 items-center">
              <div>
                <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${featureStyle.pill} mb-4`}>{currentFeature.label}</span>
                <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">{currentFeature.title}</h3>
                <p className="mb-6 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{currentFeature.desc}</p>
                <ul className="space-y-3">
                  {currentFeature.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className={`h-1.5 w-1.5 rounded-full ${featureStyle.bullet}`} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center">
                <div className="rounded-2xl bg-gray-50 dark:bg-dark-surface border border-gray-100 dark:border-dark-border p-8 w-full max-w-xs">
                  <RiskGauge score={stats.avgRiskScore || 38} size={160} label={currentFeature.label} />
                  <div className="mt-4 flex justify-center gap-3">
                    {(['angel', ...DEBATE_AGENTS] as SpeakerId[]).map((id) => (
                      <AgentAvatar key={id} agentId={id} size="sm" showName={false} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          <div className="mt-6 flex justify-center gap-2">
            {FEATURES.map((f) => (
              <button key={f.id} onClick={() => setActiveFeature(f.id)} className={`h-2 rounded-full transition-all ${f.id === activeFeature ? 'w-8 bg-orange-600' : 'w-2 bg-gray-200 dark:bg-gray-700'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* SENATORS SHOWCASE */}
      <section className="gradient-section py-24">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollSection>
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">Meet the Senate</p>
            <h2 className="mb-4 text-center text-4xl font-bold tracking-tight text-gray-900 dark:text-white">5 agents. 5 mandates. Every angle covered.</h2>
            <p className="mx-auto mb-16 max-w-xl text-center text-gray-500 dark:text-gray-400">Each AI senator brings a distinct perspective to governance analysis, ensuring adversarial coverage of every proposal.</p>
          </ScrollSection>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {(['angel', ...DEBATE_AGENTS] as SpeakerId[]).map((id, i) => {
              const agent = AGENT_PROFILES[id];
              const bgs: Record<string, string> = {
                angel: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
                caesar: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
                brutus: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
                cassius: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
                portia: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',
              };
              return (
                <ScrollSection key={id} delay={i * 0.1}>
                  <div className={`rounded-2xl border p-6 text-center transition-all hover:shadow-lg hover:-translate-y-1 ${bgs[id] || ''}`}>
                    <div className="mx-auto mb-4 flex justify-center">
                      <AgentAvatar agentId={id} size="xl" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{agent.name}</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{agent.title}</p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{agent.persona}</p>
                    <p className="mt-3 text-xs italic text-gray-400 dark:text-gray-500">&ldquo;{agent.catchphrase.slice(0, 80)}...&rdquo;</p>
                  </div>
                </ScrollSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* BUILT FOR */}
      <section className="bg-white dark:bg-dark-bg py-24">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollSection>
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-senate-green dark:text-emerald-400">Built for everyone in governance</p>
            <h2 className="mb-12 text-center text-4xl font-bold tracking-tight text-gray-900 dark:text-white">One platform, every stakeholder</h2>
          </ScrollSection>
          <div className="grid gap-4 md:grid-cols-4">
            {ROLES.map((role, i) => (
              <motion.div key={role.title} animate={{ scale: activeRole === i ? 1.03 : 1, borderColor: activeRole === i ? '#C2410C' : theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} transition={{ duration: 0.3 }} className={`cursor-pointer rounded-2xl border-2 bg-white dark:bg-dark-card p-6 shadow-sm transition-shadow ${activeRole === i ? 'shadow-lg' : ''}`} onClick={() => setActiveRole(i)}>
                <h4 className={`text-xs font-bold uppercase tracking-widest mb-2 ${activeRole === i ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>{role.title}</h4>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{role.subtitle}</p>
                <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: activeRole === i ? 'auto' : 0, opacity: activeRole === i ? 1 : 0 }} transition={{ duration: 0.3 }} className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed overflow-hidden">{role.desc}</motion.p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* RECENT PROPOSALS */}
      <section className="gradient-section py-24">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollSection>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">Live Data</p>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Recent Proposals</h2>
              </div>
              <Link href="/proposals" className="text-sm font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 transition-colors">View all &rarr;</Link>
            </div>
          </ScrollSection>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">{proposals.slice(0, 3).map((p, i) => <ProposalCard key={p.id} proposal={p} index={i} />)}</div>
              {proposals.length > 3 && (
                <div className="mt-6 text-center">
                  <Link href="/proposals" className="inline-flex items-center gap-2 rounded-xl border border-senate-border dark:border-dark-border bg-white dark:bg-dark-card px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm transition-all hover:shadow-md hover:border-orange-500/30">
                    View All {proposals.length} Proposals &rarr;
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white dark:bg-dark-bg py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <ScrollSection>
            <div className="flex justify-center">
              <SenateLogo variant={theme === 'dark' ? 'dark' : 'light'} size="lg" />
            </div>
            <h2 className="mt-8 text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Is your DAO voting blind?</h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">SENATE gives your governance the intelligence it needs — simulation-backed, adversarially debated, and verified on-chain.</p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-8 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">Launch Live Demo</Link>
              <Link href="/reports" className="inline-flex items-center gap-2 rounded-xl border border-senate-border dark:border-dark-border bg-white dark:bg-dark-card px-8 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm transition-all hover:shadow-md">View Reports</Link>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-senate-border dark:border-dark-border bg-senate-bg dark:bg-dark-card py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <SenateLogo variant={theme === 'dark' ? 'dark' : 'light'} size="sm" showTagline />
            <div className="flex gap-6 text-xs text-gray-400 dark:text-gray-500">
              <Link href="/proposals" className="hover:text-gray-600 dark:hover:text-gray-300">Proposals</Link>
              <Link href="/reports" className="hover:text-gray-600 dark:hover:text-gray-300">Reports</Link>
              <Link href="/admin" className="hover:text-gray-600 dark:hover:text-gray-300">Admin</Link>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Built on CRE. Simulated on Tenderly. Secured by Chainlink.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
