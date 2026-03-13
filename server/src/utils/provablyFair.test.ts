import { describe, it, expect } from 'vitest';
import { createHash, createHmac } from 'node:crypto';
import {
  generateServerSeed,
  hashServerSeed,
  computeResultIndex,
  computeTargetRotation,
} from './provablyFair.js';

describe('generateServerSeed', () => {
  it('returns a 64-character hex string (32 bytes)', () => {
    const seed = generateServerSeed();
    expect(seed).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns a unique seed each time', () => {
    const seeds = new Set(Array.from({ length: 100 }, () => generateServerSeed()));
    expect(seeds.size).toBe(100);
  });
});

describe('hashServerSeed', () => {
  it('returns a valid SHA-256 hex digest', () => {
    const hash = hashServerSeed('abc');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic', () => {
    expect(hashServerSeed('hello')).toBe(hashServerSeed('hello'));
  });

  it('matches the Node.js crypto output', () => {
    const seed = 'testseed123';
    const expected = createHash('sha256').update(seed).digest('hex');
    expect(hashServerSeed(seed)).toBe(expected);
  });

  it('produces different hashes for different inputs', () => {
    expect(hashServerSeed('a')).not.toBe(hashServerSeed('b'));
  });
});

describe('computeResultIndex', () => {
  it('returns a value within [0, totalSegments)', () => {
    const seed = generateServerSeed();
    for (let segments = 2; segments <= 20; segments++) {
      const idx = computeResultIndex(seed, 'client123', 0, segments);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(segments);
    }
  });

  it('is deterministic for the same inputs', () => {
    const seed = 'fixed-server-seed';
    const a = computeResultIndex(seed, 'fixed-client', 0, 10);
    const b = computeResultIndex(seed, 'fixed-client', 0, 10);
    expect(a).toBe(b);
  });

  it('changes when the client seed changes', () => {
    const seed = generateServerSeed();
    const results = new Set(
      Array.from({ length: 10 }, (_, i) => computeResultIndex(seed, `client-${i}`, 0, 100))
    );
    expect(results.size).toBeGreaterThan(1);
  });

  it('changes when the nonce changes', () => {
    const seed = generateServerSeed();
    const results = new Set(
      Array.from({ length: 10 }, (_, i) => computeResultIndex(seed, 'same-client', i, 100))
    );
    expect(results.size).toBeGreaterThan(1);
  });

  it('matches the reference HMAC-SHA256 algorithm', () => {
    const serverSeed = 'test-server-seed';
    const clientSeed = 'test-client-seed';
    const nonce = 3;
    const totalSegments = 7;

    const hmac = createHmac('sha256', serverSeed);
    hmac.update(`${clientSeed}:${nonce}`);
    const hex = hmac.digest('hex');
    const expected = parseInt(hex.slice(0, 8), 16) % totalSegments;

    expect(computeResultIndex(serverSeed, clientSeed, nonce, totalSegments)).toBe(expected);
  });

  it('throws for totalSegments < 1', () => {
    expect(() => computeResultIndex('seed', 'client', 0, 0)).toThrow();
  });
});

describe('computeTargetRotation', () => {
  it('produces at least 1800 extra degrees of rotation', () => {
    const current = 0;
    const result = computeTargetRotation(current, 0, 5);
    expect(result).toBeGreaterThan(current + 1800);
  });

  it('produces at least 1800 extra degrees from a non-zero current rotation', () => {
    const current = 2124;
    const result = computeTargetRotation(current, 2, 5);
    expect(result).toBeGreaterThan(current + 1800);
  });

  it('lands on the correct segment for each possible index', () => {
    const getIndexFromRotation = (deg: number, n: number) => {
      const sliceDeg = 360 / n;
      const norm = deg % 360;
      return Math.floor(((360 - norm) % 360) / sliceDeg);
    };

    for (let totalSegments = 2; totalSegments <= 12; totalSegments++) {
      for (let targetIndex = 0; targetIndex < totalSegments; targetIndex++) {
        const rotation = computeTargetRotation(0, targetIndex, totalSegments);
        const landed = getIndexFromRotation(rotation, totalSegments);
        expect(landed).toBe(targetIndex);
      }
    }
  });

  it('works after multiple spins (non-zero current rotation)', () => {
    const getIndexFromRotation = (deg: number, n: number) => {
      const sliceDeg = 360 / n;
      const norm = deg % 360;
      return Math.floor(((360 - norm) % 360) / sliceDeg);
    };

    let current = 0;
    const N = 6;
    for (let i = 0; i < 20; i++) {
      const targetIndex = i % N;
      current = computeTargetRotation(current, targetIndex, N);
      expect(getIndexFromRotation(current, N)).toBe(targetIndex);
    }
  });
});
