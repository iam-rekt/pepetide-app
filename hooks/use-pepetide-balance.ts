'use client';

import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getHolderTier, getThreadVoteWeight } from '@/lib/holder';
import { PEPETIDE_MINT, isTokenConfigured } from '@/lib/token';
import { derivePeptardHandle } from '@/lib/wallet';

export function usePepetideBalance() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [handle, setHandle] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setHandle(null);
      return;
    }

    void derivePeptardHandle(publicKey as PublicKey).then(setHandle);
  }, [publicKey]);

  useEffect(() => {
    if (!publicKey || !isTokenConfigured) {
      setBalance(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const mint = new PublicKey(PEPETIDE_MINT);
        const accounts = await connection.getParsedTokenAccountsByOwner(
          publicKey as PublicKey,
          { mint }
        );

        if (cancelled) return;

        const uiAmount = accounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount ?? 0;
        setBalance(uiAmount);
      } catch (error) {
        console.warn('[wallet] balance fetch failed', error);
        if (!cancelled) setBalance(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicKey, connection]);

  const tier = getHolderTier(balance);

  return {
    publicKey,
    connected,
    handle,
    balance,
    loading,
    tier,
    voteWeight: getThreadVoteWeight(balance),
    isTokenConfigured,
  };
}
