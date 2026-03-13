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
  // First 4 bytes → 32-bit unsigned integer, then mod to get segment index
  const value = parseInt(hex.slice(0, 8), 16);
  return value % totalSegments;
}

/**
 * Given a current canvas rotation (degrees) and a target segment index,
 * returns the new rotation (degrees) the canvas should animate to.
 *
 * Guarantees at least 5 full rotations (1800°) from the current position
 * and that getIndexFromRotation(result, totalSegments) === targetIndex.
 */
export function computeTargetRotation(
  currentRotation: number,
  targetIndex: number,
  totalSegments: number
): number {
  const sliceAngle = 360 / totalSegments;
  // Pick the midpoint of the target segment so the pointer lands in its centre
  // getIndexFromRotation logic: index = floor((360 - R%360)%360 / sliceAngle)
  // Desired: (360 - R%360)%360 ≈ (targetIndex + 0.5) * sliceAngle
  // => R%360 = (360 - (targetIndex + 0.5) * sliceAngle + 360) % 360
  const targetMod = (360 - (targetIndex + 0.5) * sliceAngle + 360) % 360;
  const minRotation = currentRotation + 1800; // at least 5 full extra turns
  const fullTurns = Math.ceil((minRotation - targetMod) / 360);
  const newRotation = fullTurns * 360 + targetMod;
  // Safety: ensure we actually exceeded minRotation
  return newRotation > minRotation ? newRotation : newRotation + 360;
}
