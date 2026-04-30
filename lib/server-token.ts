import { createHash } from 'crypto';
import { Connection, PublicKey } from '@solana/web3.js';
import { getHolderTier, getThreadVoteWeight } from '@/lib/holder';
import { PEPETIDE_MINT, SOLANA_RPC_URL, isTokenConfigured } from '@/lib/token';

export interface WalletTokenIdentity {
  walletHash: string;
  handle: string;
  balance: number;
  holderTier: string;
  voteWeight: number;
}

const connection = new Connection(SOLANA_RPC_URL);

function hashBytes(bytes: Uint8Array): string {
  return createHash('sha256').update(Buffer.from(bytes)).digest('hex');
}

export function hashWalletAddress(walletAddress: string): string | null {
  try {
    return hashBytes(new PublicKey(walletAddress).toBytes());
  } catch {
    return null;
  }
}

export function derivePeptardHandleFromAddress(walletAddress: string): string | null {
  try {
    const publicKey = new PublicKey(walletAddress);
    const hex = hashBytes(publicKey.toBytes()).slice(0, 8);
    return `Peptard-${hex}`;
  } catch {
    return null;
  }
}

export async function getWalletTokenIdentity(walletAddress?: string): Promise<WalletTokenIdentity | null> {
  if (!walletAddress || !isTokenConfigured) {
    return null;
  }

  try {
    const owner = new PublicKey(walletAddress);
    const mint = new PublicKey(PEPETIDE_MINT);
    const accounts = await connection.getParsedTokenAccountsByOwner(owner, { mint });
    const balance = accounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount ?? 0;
    const tier = getHolderTier(balance);

    return {
      walletHash: hashBytes(owner.toBytes()),
      handle: `Peptard-${hashBytes(owner.toBytes()).slice(0, 8)}`,
      balance,
      holderTier: tier.id,
      voteWeight: getThreadVoteWeight(balance),
    };
  } catch (error) {
    console.warn('[token] wallet identity lookup failed', error);
    return null;
  }
}
