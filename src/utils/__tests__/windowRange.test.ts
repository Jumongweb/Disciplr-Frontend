import { describe, expect, it } from 'vitest';
import { WINDOW_SIZE, WINDOW_THRESHOLD, windowRange } from '../windowRange';

// ── helpers ───────────────────────────────────────────────────────────────────
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

// ── constants ─────────────────────────────────────────────────────────────────
describe('constants', () => {
  it('WINDOW_THRESHOLD is 50', () => expect(WINDOW_THRESHOLD).toBe(50));
  it('WINDOW_SIZE is 40', () => expect(WINDOW_SIZE).toBe(40));
});

// ── zero / empty list ─────────────────────────────────────────────────────────
describe('empty list', () => {
  it('returns empty items and windowed=false', () => {
    const r = windowRange([]);
    expect(r.items).toEqual([]);
    expect(r.startIndex).toBe(0);
    expect(r.endIndex).toBe(0);
    expect(r.windowed).toBe(false);
  });
});

// ── below threshold (no windowing) ───────────────────────────────────────────
describe('below threshold', () => {
  it('returns the full list unchanged for a single item', () => {
    const list = [42];
    const r = windowRange(list);
    expect(r.items).toBe(list); // same reference
    expect(r.windowed).toBe(false);
    expect(r.startIndex).toBe(0);
    expect(r.endIndex).toBe(1);
  });

  it('returns full list for exactly WINDOW_THRESHOLD items', () => {
    const list = range(WINDOW_THRESHOLD);
    const r = windowRange(list);
    expect(r.items).toBe(list);
    expect(r.windowed).toBe(false);
    expect(r.items).toHaveLength(WINDOW_THRESHOLD);
  });

  it('returns full list for WINDOW_THRESHOLD - 1 items', () => {
    const list = range(WINDOW_THRESHOLD - 1);
    const r = windowRange(list);
    expect(r.windowed).toBe(false);
    expect(r.items).toBe(list);
  });
});

// ── at / above threshold (windowing active) ───────────────────────────────────
describe('above threshold', () => {
  it('activates windowing for WINDOW_THRESHOLD + 1 items', () => {
    const list = range(WINDOW_THRESHOLD + 1);
    const r = windowRange(list);
    expect(r.windowed).toBe(true);
    expect(r.items).toHaveLength(WINDOW_SIZE);
  });

  it('starts at 0 when anchorIndex defaults to 0', () => {
    const list = range(100);
    const r = windowRange(list);
    expect(r.startIndex).toBe(0);
    expect(r.endIndex).toBe(WINDOW_SIZE);
    expect(r.items[0]).toBe(0);
    expect(r.items[r.items.length - 1]).toBe(WINDOW_SIZE - 1);
  });

  it('centres window on anchorIndex', () => {
    const list = range(100);
    const r = windowRange(list, 30);
    expect(r.startIndex).toBe(30);
    expect(r.endIndex).toBe(30 + WINDOW_SIZE);
  });

  it('clamps window to end of list when anchorIndex is near the tail', () => {
    const list = range(100);
    const r = windowRange(list, 90);
    expect(r.endIndex).toBe(100);
    expect(r.startIndex).toBe(100 - WINDOW_SIZE);
    expect(r.items).toHaveLength(WINDOW_SIZE);
  });

  it('clamps negative anchorIndex to 0', () => {
    const list = range(100);
    const r = windowRange(list, -5);
    expect(r.startIndex).toBe(0);
  });

  it('clamps anchorIndex beyond list length to safe start', () => {
    const list = range(100);
    const r = windowRange(list, 9999);
    expect(r.endIndex).toBe(100);
    expect(r.items).toHaveLength(WINDOW_SIZE);
  });

  it('respects a custom windowSize override', () => {
    const list = range(100);
    const r = windowRange(list, 0, 10);
    expect(r.items).toHaveLength(10);
    expect(r.endIndex).toBe(10);
  });

  it('clamps windowSize=0 to at least 1 item', () => {
    const list = range(100);
    const r = windowRange(list, 0, 0);
    expect(r.items).toHaveLength(1);
  });

  it('handles very large list (1000 items)', () => {
    const list = range(1000);
    const r = windowRange(list, 500);
    expect(r.windowed).toBe(true);
    expect(r.items).toHaveLength(WINDOW_SIZE);
    expect(r.startIndex).toBe(500);
    expect(r.endIndex).toBe(500 + WINDOW_SIZE);
  });

  it('items are a slice of the original array (not a reference)', () => {
    const list = range(100);
    const r = windowRange(list);
    expect(r.items).not.toBe(list);
    expect(r.items[0]).toBe(list[0]);
  });
});

// ── generic type preservation ─────────────────────────────────────────────────
describe('generic type preservation', () => {
  it('preserves object references inside the window', () => {
    const objs = range(100).map((i) => ({ id: i }));
    const r = windowRange(objs, 10);
    expect(r.items[0]).toBe(objs[10]);
  });
});
