import { describe, it, expect } from 'vitest';
import { getIndexFromRotation, computeTargetRotation } from './wheelMath.js';

// ---------------------------------------------------------------------------
// getIndexFromRotation
// ---------------------------------------------------------------------------
// Implements: i = ⌊ ((360 − R mod 360) mod 360) / (360/n) ⌋
// The pointer sits at the top (0°). Positive rotation turns clockwise.
// ---------------------------------------------------------------------------

describe('getIndexFromRotation', () => {
  it('returns -1 when totalSegments is 0', () => {
    expect(getIndexFromRotation(0, 0)).toBe(-1);
    expect(getIndexFromRotation(180, 0)).toBe(-1);
  });

  it('returns 0 for any rotation when there is only 1 segment', () => {
    expect(getIndexFromRotation(0, 1)).toBe(0);
    expect(getIndexFromRotation(180, 1)).toBe(0);
    expect(getIndexFromRotation(359.99, 1)).toBe(0);
  });

  // --- 4-segment wheel (sliceAngle = 90°): segments 0..3 clockwise ---
  describe('n=4 cardinal positions', () => {
    it('R=0° → segment 0', () => expect(getIndexFromRotation(0, 4)).toBe(0));
    it('R=90° → segment 3', () => expect(getIndexFromRotation(90, 4)).toBe(3));
    it('R=180° → segment 2', () => expect(getIndexFromRotation(180, 4)).toBe(2));
    it('R=270° → segment 1', () => expect(getIndexFromRotation(270, 4)).toBe(1));
  });

  // --- Boundary behaviour: floor, not rounding ---
  //
  // For n=4, pointerAngle = (360 − R%360) % 360:
  //   R=0       → pointerAngle=0   → seg 0  (modulo special case)
  //   R∈(0,90]  → pointerAngle∈[270,360) → seg 3
  //   R∈(90,180]→ pointerAngle∈[180,270) → seg 2
  //   R∈(180,270]→pointerAngle∈[90,180)  → seg 1
  //   R∈(270,360)→pointerAngle∈(0,90)    → seg 0
  //
  // The boundary at R=90° is INCLUSIVE of segment 3 (floor):
  //   R=89.999 → seg 3  (well within seg 3 territory)
  //   R=90     → seg 3  (boundary value belongs to seg 3 via floor(270/90)=3)
  //   R=90.001 → seg 2  (just crossed into seg 2)
  describe('segment boundary determinism ("between two" ambiguity)', () => {
    it('n=4: R=89.999° is firmly in segment 3 (not at any boundary)', () => {
      // pointerAngle = 360−89.999 = 270.001 → floor(270.001/90) = 3
      expect(getIndexFromRotation(89.999, 4)).toBe(3);
    });

    it('n=4: R=90° belongs to segment 3 (boundary is floor-inclusive)', () => {
      // pointerAngle = 360−90 = 270 → floor(270/90) = 3, not 2
      expect(getIndexFromRotation(90, 4)).toBe(3);
    });

    it('n=4: R=90.001° transitions to segment 2 (just past boundary)', () => {
      // pointerAngle = 269.999 → floor(269.999/90) = 2
      expect(getIndexFromRotation(90.001, 4)).toBe(2);
    });

    it('n=4: consecutive boundary transitions are each one-sided', () => {
      // Each transition flips exactly at R = k*90: R just above crosses, R at/below stays
      const n = 4;
      [90, 180, 270].forEach((boundary) => {
        const atBoundary = getIndexFromRotation(boundary, n);
        const justAbove = getIndexFromRotation(boundary + 0.001, n);
        expect(atBoundary).not.toBe(justAbove);
      });
    });

    it('n=6: each boundary at R=60k° is one-sided (below==at, above transitions)', () => {
      const n = 6; // sliceAngle = 60°, boundaries at R=60°,120°,180°,240°,300°
      [60, 120, 180, 240, 300].forEach((boundary) => {
        const atBoundary = getIndexFromRotation(boundary, n);
        const justBelow = getIndexFromRotation(boundary - 0.001, n);
        const justAbove = getIndexFromRotation(boundary + 0.001, n);
        // AT the boundary == just below (boundary belongs to lower segment)
        expect(atBoundary).toBe(justBelow);
        // Just above transitions to a different segment
        expect(atBoundary).not.toBe(justAbove);
      });
    });
  });

  // --- Accumulated rotations (R > 360°) ---
  describe('accumulated rotations are equivalent to R % 360', () => {
    it('R=450° behaves like R=90°', () => {
      expect(getIndexFromRotation(450, 4)).toBe(getIndexFromRotation(90, 4));
    });

    it('R=1890° behaves like R=1890%360', () => {
      const expected = getIndexFromRotation(1890 % 360, 6);
      expect(getIndexFromRotation(1890, 6)).toBe(expected);
    });

    it('large accumulated rotation (>3600°)', () => {
      const big = 5400 + 135;
      expect(getIndexFromRotation(big, 8)).toBe(getIndexFromRotation(135, 8));
    });
  });

  // --- Range invariant: index ∈ [0, n) for all n ---
  describe('index is always within [0, n)', () => {
    const segmentCounts = [2, 3, 4, 5, 6, 8, 12];
    const sampleAngles = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 240, 270, 300, 315, 359.99];

    segmentCounts.forEach((n) => {
      sampleAngles.forEach((r) => {
        it(`n=${n}, R=${r}° → index in [0, ${n})`, () => {
          const idx = getIndexFromRotation(r, n);
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThan(n);
        });
      });
    });
  });
});

// ---------------------------------------------------------------------------
// computeTargetRotation
// ---------------------------------------------------------------------------
// Must produce a final rotation that:
//   1. Is always > curRotation + 1800 (≥5 full turns — deceleration guarantee)
//   2. Resolves to the correct targetIndex via getIndexFromRotation (round-trip)
//   3. Targets the midpoint of the segment, not a boundary
// ---------------------------------------------------------------------------

describe('computeTargetRotation', () => {
  // --- Minimum rotation guarantee (deceleration) ---
  describe('always rotates at least 1800° (5 full turns)', () => {
    it('from R=0, any target gives result > 1800', () => {
      for (let i = 0; i < 4; i++) {
        expect(computeTargetRotation(0, i, 4)).toBeGreaterThan(1800);
      }
    });

    it('from accumulated R=3600, result > 3600+1800', () => {
      const cur = 3600;
      for (let i = 0; i < 6; i++) {
        expect(computeTargetRotation(cur, i, 6)).toBeGreaterThan(cur + 1800);
      }
    });
  });

  // --- Round-trip coherence ---
  describe('round-trip: getIndexFromRotation(result % 360, n) === targetIndex', () => {
    const cases: Array<[number, number]> = [
      [2, 0],
      [2, 1],
      [4, 0],
      [4, 1],
      [4, 2],
      [4, 3],
      [6, 0],
      [6, 3],
      [6, 5],
      [8, 0],
      [8, 4],
      [8, 7],
    ];

    cases.forEach(([n, targetIndex]) => {
      it(`n=${n}, target=${targetIndex}: round-trip is exact`, () => {
        const result = computeTargetRotation(0, targetIndex, n);
        expect(getIndexFromRotation(result % 360, n)).toBe(targetIndex);
      });
    });
  });

  // --- Midpoint targeting (not landing on boundary) ---
  describe('lands at the midpoint of the target segment, never on a boundary', () => {
    it('n=4: result mod 360 is in the interior of the target slice', () => {
      const n = 4;
      const sliceAngle = 360 / n;

      for (let targetIndex = 0; targetIndex < n; targetIndex++) {
        const result = computeTargetRotation(0, targetIndex, n);
        const finalMod = result % 360;
        // Pointer angle (from which segment is derived)
        const pointerAngle = (360 - finalMod) % 360;
        const segStart = targetIndex * sliceAngle;
        const segEnd = segStart + sliceAngle;
        // Must be strictly inside the slice
        expect(pointerAngle).toBeGreaterThan(segStart);
        expect(pointerAngle).toBeLessThan(segEnd);
      }
    });

    it('n=8: result mod 360 is in the interior of the target slice', () => {
      const n = 8;
      const sliceAngle = 360 / n;

      for (let targetIndex = 0; targetIndex < n; targetIndex++) {
        const result = computeTargetRotation(0, targetIndex, n);
        const finalMod = result % 360;
        const pointerAngle = (360 - finalMod) % 360;
        const segStart = targetIndex * sliceAngle;
        const segEnd = segStart + sliceAngle;
        expect(pointerAngle).toBeGreaterThan(segStart);
        expect(pointerAngle).toBeLessThan(segEnd);
      }
    });
  });

  // --- Works with accumulated curRotation ---
  describe('works correctly with accumulated curRotation', () => {
    it('after many spins (curRotation=7200), still targets correctly', () => {
      const cur = 7200;
      const result = computeTargetRotation(cur, 2, 4);
      expect(result).toBeGreaterThan(cur + 1800);
      expect(getIndexFromRotation(result % 360, 4)).toBe(2);
    });

    it('result is always greater than curRotation', () => {
      const rotations = [0, 360, 1800, 3600, 9000];
      rotations.forEach((cur) => {
        const result = computeTargetRotation(cur, 0, 6);
        expect(result).toBeGreaterThan(cur);
      });
    });
  });
});
