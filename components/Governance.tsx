'use client';

import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MoleculeIcon,
  VialIcon,
  ScrollIcon,
  SyringeIcon,
  TrendIcon,
  GearIcon,
  DropletIcon,
  ChatIcon,
} from '@/components/icons';
import { isTokenConfigured } from '@/lib/token';

const PROPOSALS: {
  id: string;
  title: string;
  status: 'open' | 'queued' | 'closed';
  endsIn: string;
  yes: number;
  no: number;
  summary: string;
}[] = [
    {
      id: 'PEP-001',
      title: 'Approve initial peptide catalog (12 peptides)',
      status: 'queued',
      endsIn: 'Voting opens at token launch',
      yes: 0,
      no: 0,
      summary:
        'Seed the community catalog with the founding 12 peptides. Holders vote on each peptide individually before it appears in the public list.',
    },
    {
      id: 'PEP-002',
      title: 'Set thread-boost lockup parameters',
      status: 'queued',
      endsIn: 'Voting opens at token launch',
      yes: 0,
      no: 0,
      summary:
        'Define the lockup duration and minimum stake required to boost a thread to the top of Threads. Default proposal: 24h lockup, min 50,000 $PEPETIDE.',
    },
    {
      id: 'PEP-003',
      title: 'Treasury allocation for IPFS pinning',
      status: 'queued',
      endsIn: 'Voting opens at token launch',
      yes: 0,
      no: 0,
      summary:
        'Authorize a recurring treasury draw to cover Storacha pinning fees and Postgres hosting. Holders vote on monthly cap.',
    },
  ];

const PILLARS = [
  {
    icon: VialIcon,
    title: 'Hold to vote',
    body: 'Voting weight = your $PEPETIDE balance at the proposal snapshot block. No staking required to vote.',
  },
  {
    icon: ScrollIcon,
    title: 'Stake to earn protocol revenue',
    body: 'Lock $PEPETIDE to receive a share of the revenue the protocol generates — research partnerships, premium tooling fees, treasury yield. Tokens never burn while staked; they unlock after the lockup.',
  },
  {
    icon: TrendIcon,
    title: 'Treasury funds peptide R&D',
    body: 'The treasury bankrolls new peptide ideas and pushes peptide science forward — research grants, lab partnerships, expert AMAs. Revenue generated from that work flows back to $PEPETIDE holders.',
  },
  {
    icon: SyringeIcon,
    title: 'Buybacks & burns',
    body: 'A portion of protocol revenue is used to buy $PEPETIDE off the open market and burn it. Tightens supply for holders and turns project growth into ongoing token-side value.',
  },
  {
    icon: ChatIcon,
    title: 'Anonymous by default',
    body: 'Threads stay anonymous-by-default. Connecting a wallet gives you a Peptard-XXXX handle and reputation — never an email or KYC.',
  },
];

export default function Governance() {
  const { connected } = useWallet();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-emerald-300/40 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-transparent to-lime-500/10 backdrop-blur-md p-6 sm:p-10"
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            v2 preview
          </span>
          <span className="text-xs font-mono text-slate-800 dark:text-slate-300 font-semibold">
            voting opens at token launch
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-br from-emerald-400 via-green-500 to-lime-500 bg-clip-text text-transparent mb-2">
          Governance
        </h1>
        <p className="text-sm sm:text-base text-slate-900 dark:text-slate-100 font-medium max-w-2xl">
          $PEPETIDE holders steer the protocol. Vote on the peptide catalog, moderation rules,
          treasury spend, and stake parameters. No accounts, no KYC — just hold the token in
          your Solana wallet.
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
      >
        {[
          { label: 'Token', value: isTokenConfigured ? 'Live' : '—', icon: VialIcon, gradient: 'from-emerald-500 to-lime-500' },
          { label: 'Holders', value: '—', icon: MoleculeIcon, gradient: 'from-cyan-500 to-blue-600' },
          { label: 'Proposals', value: PROPOSALS.length.toString(), icon: ScrollIcon, gradient: 'from-purple-500 to-pink-600' },
          { label: 'Treasury', value: '0 SOL', icon: TrendIcon, gradient: 'from-amber-500 to-orange-600' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="p-4 bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-600/30"
            >
              <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${stat.gradient} mb-2 shadow-lg`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-slate-800 dark:text-slate-300 font-medium">{stat.label}</div>
            </div>
          );
        })}
      </motion.div>

      {/* Your voting power */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-white/20 dark:border-slate-700/30 bg-white/10 dark:bg-slate-900/20 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DropletIcon className="w-5 h-5 text-emerald-500" />
              Your voting weight
            </CardTitle>
            <CardDescription>
              Voting weight equals your $PEPETIDE balance at the proposal snapshot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!connected ? (
              <div className="rounded-lg border border-emerald-300/40 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 text-sm text-slate-700 dark:text-slate-300">
                Connect a Solana wallet from the header to see your voting power once $PEPETIDE
                launches. Connecting is optional — Threads stay anonymous if you skip.
              </div>
            ) : (
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-4xl font-black bg-gradient-to-br from-emerald-400 to-lime-500 bg-clip-text text-transparent">
                  0
                </span>
                <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                  $PEPETIDE
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                  token not yet live
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Active proposals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            <ScrollIcon className="w-5 h-5 text-emerald-500" />
            Proposals
          </h2>
          <p className="mt-1 text-sm text-slate-800 dark:text-slate-200 font-medium">
            Queued proposals that go live the moment voting opens.
          </p>
        </div>
        <div className="space-y-3">
          {PROPOSALS.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-white/15 dark:border-slate-700/40 bg-white/10 dark:bg-slate-900/20 backdrop-blur-sm p-4 sm:p-5 hover:border-emerald-300/40 dark:hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  {p.id}
                </span>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${p.status === 'open'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : p.status === 'queued'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-500/20 text-slate-700 dark:text-slate-300'
                    }`}
                >
                  {p.status}
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 ml-auto">
                  {p.endsIn}
                </span>
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-1 text-slate-900 dark:text-slate-100">
                {p.title}
              </h3>
              <p className="text-sm text-slate-800 dark:text-slate-200 mb-3">{p.summary}</p>
              <div className="flex gap-2">
                <button
                  disabled
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Vote Yes ({p.yes})
                </button>
                <button
                  disabled
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-300/40 dark:border-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Vote No ({p.no})
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            <GearIcon className="w-5 h-5 text-emerald-500" />
            How it works
          </h2>
          <p className="mt-1 text-sm text-slate-800 dark:text-slate-200 font-medium">
            Four pillars. Optional, anonymous, holder-controlled.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-xl border border-white/15 dark:border-slate-700/40 bg-white/10 dark:bg-slate-900/20 backdrop-blur-sm p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-lime-500 shadow-md shadow-emerald-500/30 ring-1 ring-white/20">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1 text-slate-900 dark:text-slate-100">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {pillar.body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Roadmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            <TrendIcon className="w-5 h-5 text-emerald-500" />
            Roadmap
          </h2>
        </div>
        <div className="space-y-2 rounded-2xl border border-white/20 dark:border-slate-700/40 bg-white/40 dark:bg-slate-900/50 backdrop-blur-md p-3 shadow-lg">
          {[
            { phase: 'v1', body: 'Wallet connect + Peptard handle. Anonymous Threads. Per-section UI.' },
            { phase: 'v1.5', body: 'Read-only token balance display. Governance preview (this page).' },
            { phase: 'v2', body: 'Hold-gated handles, weighted upvotes, snapshot governance, treasury page.' },
            { phase: 'v2.5', body: 'Stake-to-boost threads, custody multisig, on-chain proposals via Realms.' },
            { phase: 'v3', body: 'Buybacks & burn — protocol revenue used to buy $PEPETIDE off the market and burn it, tightening supply for holders.' },
            { phase: 'v3.5', body: 'Anonymized data DAO (opt-in dose data → research dataset → revenue split).' },
          ].map((row) => (
            <div
              key={row.phase}
              className="grid grid-cols-[auto_1fr] items-center gap-3 sm:gap-4 rounded-lg border border-white/30 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/40 px-4 py-3 hover:border-emerald-300/50 dark:hover:border-emerald-500/40 transition-colors"
            >
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border border-emerald-400/50">
                {row.phase}
              </span>
              <span className="text-sm text-slate-900 dark:text-slate-100 font-medium">{row.body}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
