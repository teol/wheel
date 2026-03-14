import type { Segment, Wheel, SpinLog } from '../types.js';

export function isSegment(s: unknown): s is Segment {
  if (typeof s !== 'object' || s === null) return false;
  const obj = s as Record<string, unknown>;
  return (
    typeof obj.id === 'string' && typeof obj.text === 'string' && typeof obj.color === 'string'
  );
}

export function isWheel(w: unknown): w is Wheel {
  if (typeof w !== 'object' || w === null) return false;
  const obj = w as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.segments) &&
    obj.segments.every(isSegment)
  );
}

export function isSpinLog(log: unknown): log is SpinLog {
  if (typeof log !== 'object' || log === null) return false;
  const obj = log as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.timestamp === 'number' &&
    typeof obj.wheelName === 'string' &&
    typeof obj.segmentText === 'string' &&
    typeof obj.segmentColor === 'string'
  );
}
