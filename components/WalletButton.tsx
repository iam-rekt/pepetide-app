'use client';

import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { derivePeptardHandle, formatPubkey } from '@/lib/wallet';
import { PEPETIDE_MINT, isTokenConfigured } from '@/lib/token';
import { MoleculeIcon } from '@/components/icons';

function formatBalance(n: number): string {
  if (n === 0) return '0';
  if (n < 0.01) return n.toExponential(2);
  if (n < 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  return `${(n / 1_000_000_000).toFixed(2)}B`;
}

export default function WalletButton() {
  const { publicKey, connected, disconnect, connecting, wallets, select, wallet, connect } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [handle, setHandle] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setHandle(null);
      return;
    }
    void derivePeptardHandle(publicKey as PublicKey).then(setHandle);
  }, [publicKey]);

  // Fetch $PEPETIDE token balance whenever the wallet connects or mint changes.
  // No-op while PEPETIDE_MINT is unset (token not yet launched).
  useEffect(() => {
    if (!publicKey || !isTokenConfigured) {
      setBalance(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const mint = new PublicKey(PEPETIDE_MINT);
        const accounts = await connection.getParsedTokenAccountsByOwner(
          publicKey as PublicKey,
          { mint }
        );
        if (cancelled) return;
        const ui = accounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount ?? 0;
        setBalance(ui);
      } catch (e) {
        console.warn('[wallet] balance fetch failed', e);
        if (!cancelled) setBalance(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicKey, connection]);

  // After we select a wallet, the adapter sets `wallet`. Connect to it.
  useEffect(() => {
    if (wallet && !connected && !connecting) {
      connect().catch((e) => console.warn('[wallet] connect failed', e));
    }
  }, [wallet, connected, connecting, connect]);

  const handleConnectClick = () => {
    // If Phantom is already detected via Wallet Standard, select it directly.
    // Otherwise fall back to the modal (Solflare, etc.).
    const phantom = wallets.find((w) => w.adapter.name === 'Phantom' && w.readyState !== 'NotDetected');
    if (phantom) {
      select(phantom.adapter.name);
      return;
    }
    setVisible(true);
  };

  if (!connected || !publicKey) {
    return (
      <button
        onClick={handleConnectClick}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-md shadow-emerald-500/30 ring-1 ring-white/30 hover:shadow-lg hover:shadow-emerald-500/40 transition-all"
      >
        <MoleculeIcon className="w-4 h-4" />
        {connecting ? 'Connecting…' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={() => disconnect()}
        title={formatPubkey(publicKey)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-mono bg-white/70 dark:bg-slate-900/70 backdrop-blur-md text-emerald-700 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-500/30 hover:border-emerald-400 transition-all"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
          <span className="relative rounded-full bg-emerald-500 h-2 w-2" />
        </span>
        {handle ?? '…'}
      </button>
      <span className="text-[10px] sm:text-xs font-mono text-slate-700 dark:text-slate-300 text-center">
        Balance:{' '}
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
          {!isTokenConfigured
            ? '0 $PEPETIDE'
            : balance === null
              ? '…'
              : `${formatBalance(balance)} $PEPETIDE`}
        </span>
      </span>
    </div>
  );
}
