'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { derivePeptardHandle, formatPubkey } from '@/lib/wallet';
import { MoleculeIcon } from '@/components/icons';

export default function WalletButton() {
  const { publicKey, connected, disconnect, connecting, wallets, select, wallet, connect } = useWallet();
  const { setVisible } = useWalletModal();
  const [handle, setHandle] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setHandle(null);
      return;
    }
    void derivePeptardHandle(publicKey as PublicKey).then(setHandle);
  }, [publicKey]);

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
  );
}
