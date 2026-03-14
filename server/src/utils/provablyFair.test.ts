import { describe, it, expect } from 'vitest';
import { createHash, createHmac } from 'node:crypto';
import { generateServerSeed, hashServerSeed, computeResultIndex } from './provablyFair.js';

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
    const expected = Math.floor((parseInt(hex.slice(0, 8), 16) / 2 ** 32) * totalSegments);

    expect(computeResultIndex(serverSeed, clientSeed, nonce, totalSegments)).toBe(expected);
  });

  it('throws for totalSegments < 1', () => {
    expect(() => computeResultIndex('seed', 'client', 0, 0)).toThrow();
  });
});
