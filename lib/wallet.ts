import type { PublicKey } from '@solana/web3.js';

/**
 * Derive a deterministic, anonymous handle from a Solana public key.
 *
 * Uses the first 8 hex chars of SHA-256(pubkey) to keep the visible identifier
 * short and stable per wallet. The full address is never exposed in the handle.
 */
export async function derivePeptardHandle(pubkey: PublicKey): Promise<string> {
  const src = pubkey.toBytes();
  const buf = new ArrayBuffer(src.byteLength);
  new Uint8Array(buf).set(src);
  const digest = await crypto.subtle.digest('SHA-256', buf as ArrayBuffer);
  const hex = Array.from(new Uint8Array(digest).slice(0, 4))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `Peptard-${hex}`;
}

/** Truncated address for tooltips: `aBcd…WxYz`. */
export function formatPubkey(pubkey: PublicKey | string): string {
  const s = typeof pubkey === 'string' ? pubkey : pubkey.toBase58();
  if (s.length <= 10) return s;
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}
