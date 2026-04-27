'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import type { Adapter, WalletError } from '@solana/wallet-adapter-base';
import { SOLANA_RPC_URL } from '@/lib/token';

import '@solana/wallet-adapter-react-ui/styles.css';

export default function WalletProvider({ children }: { children: ReactNode }) {
  // Phantom and Solflare both register themselves as Wallet Standard providers,
  // so the adapter auto-discovers them. Including legacy adapters causes
  // duplicates and silent connect failures.
  const wallets = useMemo<Adapter[]>(() => [], []);

  const onError = useCallback((error: WalletError) => {
    // Surface adapter errors so a stuck "Connecting…" state doesn't go silent.
    console.warn('[wallet]', error.name, error.message);
  }, []);

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      <SolanaWalletProvider wallets={wallets} onError={onError} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
