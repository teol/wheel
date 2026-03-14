import { createHash, createHmac, randomBytes } from 'node:crypto';

/**
 * Generates a cryptographically random server seed (32 bytes hex).
 */
export function generateServerSeed(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Returns SHA-256 hash of the server seed.
 * This hash is revealed to the user BEFORE the spin so they can verify
 * the server did not change the seed after seeing their client seed.
 */
export function hashServerSeed(serverSeed: string): string {
  return createHash('sha256').update(serverSeed).digest('hex');
}

/**
 * Deterministically computes the winning segment index.
 *
 * Algorithm: HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}`)
 *   → take first 8 hex chars as uint32
 *   → mod totalSegments
 *
 * This is equivalent to the algorithm used by many provably fair casinos
 * (Stake, BC.game, etc.) and is independently verifiable by anyone.
 */
export function computeResultIndex(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  totalSegments: number
): number {
  if (totalSegments <= 0) throw new Error('totalSegments must be >= 1');
  const hmac = createHmac('sha256', serverSeed);
  hmac.update(`${clientSeed}:${nonce}`);
  const hex = hmac.digest('hex');
  // First 4 bytes → 32-bit unsigned integer, scaled to [0, totalSegments)
  // Dividing by 2**32 converts to a float in [0, 1) before scaling, which
  // avoids the modulo bias that would occur with a direct % operation.
  const value = parseInt(hex.slice(0, 8), 16);
  return Math.floor((value / 2 ** 32) * totalSegments);
}
