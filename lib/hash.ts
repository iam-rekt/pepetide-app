/**
 * Hash IP address or identifier for privacy
 */
export async function hashIP(ip: string): Promise<string> {
  if (typeof window === 'undefined') {
    // Server-side: use Node.js crypto
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(ip).digest('hex');
  } else {
    // Client-side: use Web Crypto API
    const encoder = new TextEncoder();
    const src = encoder.encode(ip);
    const buf = new ArrayBuffer(src.byteLength);
    new Uint8Array(buf).set(src);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buf);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
