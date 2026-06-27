import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { ValidationTask } from '../../Zustand/Store';
import { filterValidationHistory, paginate } from '../paginate';

const history: ValidationTask[] = [
  {
    id: 'v-1',
    vaultName: 'Alpha Vault',
    owner: 'GBVZ...QK7L',
    amount: '1,000 USDC',
    deadline: '2026-01-01',
    daysRemaining: 0,
    status: 'approved',
    milestone: 'Launch',
  },
  {
    id: 'v-2',
    vaultName: 'Beta Reserve',
    owner: 'GFAIL...QK7L',
    amount: '2,000 USDC',
    deadline: '2026-01-02',
    daysRemaining: 0,
    status: 'rejected',
    milestone: 'Audit',
  },
  {
    id: 'v-3',
    vaultName: 'Gamma Fund',
    owner: 'GSUCC...QK7L',
    amount: '3,000 USDC',
    deadline: '2026-01-03',
    daysRemaining: 0,
    status: 'approved',
    milestone: 'Delivery',
  },
];

describe('filterValidationHistory', () => {
  it('filters by approved or rejected status', () => {
    expect(filterValidationHistory(history, { status: 'approved', query: '' }).map((t) => t.id)).toEqual([
      'v-1',
      'v-3',
    ]);
    expect(filterValidationHistory(history, { status: 'rejected', query: '' }).map((t) => t.id)).toEqual([
      'v-2',
    ]);
  });

  it('searches vault names and owners case-insensitively', () => {
    expect(filterValidationHistory(history, { status: 'all', query: 'reserve' }).map((t) => t.id)).toEqual([
      'v-2',
    ]);
    expect(filterValidationHistory(history, { status: 'all', query: 'gsucc' }).map((t) => t.id)).toEqual([
      'v-3',
    ]);
  });

  it('combines status and query filters', () => {
    expect(filterValidationHistory(history, { status: 'rejected', query: 'alpha' })).toEqual([]);
  });

  it('treats a whitespace-only query as no query', () => {
    expect(filterValidationHistory(history, { status: 'all', query: '   ' }).map((t) => t.id)).toEqual([
      'v-1',
      'v-2',
      'v-3',
    ]);
  });

  describe('properties', () => {
    const taskArb: fc.Arbitrary<ValidationTask> = fc.record({
      id: fc.uuid(),
      vaultName: fc.string({ minLength: 1, maxLength: 20 }),
      owner: fc.string({ minLength: 1, maxLength: 20 }),
      amount: fc.string(),
      deadline: fc.string(),
      daysRemaining: fc.integer({ min: 0, max: 365 }),
      status: fc.constantFrom<ValidationTask['status']>('pending', 'approved', 'rejected'),
      milestone: fc.string(),
    });

    const toMixedCase = (value: string) =>
      value
        .split('')
        .map((char, index) => (index % 2 === 0 ? char.toUpperCase() : char.toLowerCase()))
        .join('');

    it('with status "all", returns exactly the tasks matching the query', () => {
      fc.assert(
        fc.property(
          fc.array(taskArb, { maxLength: 20 }),
          fc.string({ maxLength: 10 }),
          (tasks, query) => {
            const result = filterValidationHistory(tasks, { status: 'all', query });
            const normalizedQuery = query.trim().toLowerCase();
            const expected = tasks.filter(
              (task) =>
                normalizedQuery.length === 0 ||
                task.vaultName.toLowerCase().includes(normalizedQuery) ||
                task.owner.toLowerCase().includes(normalizedQuery),
            );

            expect(result).toEqual(expected);
          },
        ),
      );
    });

    it('matches vaultName and owner case-insensitively', () => {
      fc.assert(
        fc.property(
          fc.array(taskArb, { minLength: 1, maxLength: 20 }),
          fc.nat(),
          fc.boolean(),
          (tasks, indexSeed, useOwner) => {
            const index = indexSeed % tasks.length;
            const target = tasks[index];
            const field = useOwner ? target.owner : target.vaultName;
            fc.pre(field.trim().length > 0);

            const query = toMixedCase(field);
            const result = filterValidationHistory(tasks, { status: 'all', query });

            expect(result.some((task) => task.id === target.id)).toBe(true);
          },
        ),
      );
    });
  });
});

describe('paginate', () => {
  it('returns a normalized page of items', () => {
    const result = paginate(history, 2, 2);

    expect(result.items.map((item) => item.id)).toEqual(['v-3']);
    expect(result.currentPage).toBe(2);
    expect(result.pageCount).toBe(2);
    expect(result.totalItems).toBe(3);
    expect(result.pageSize).toBe(2);
  });

  it('clamps page and page size to safe values', () => {
    expect(paginate(history, 99, 2).currentPage).toBe(2);
    expect(paginate(history, -1, 0)).toMatchObject({
      currentPage: 1,
      pageSize: 1,
      pageCount: 3,
    });
  });

  it('handles an empty array without throwing', () => {
    expect(paginate([], 1, 10)).toMatchObject({
      items: [],
      currentPage: 1,
      pageCount: 1,
      totalItems: 0,
      pageSize: 10,
    });
  });

  describe('properties', () => {
    const itemsArb = fc.array(fc.integer(), { maxLength: 50 });

    it('keeps currentPage within [1, pageCount] and items within pageSize', () => {
      fc.assert(
        fc.property(
          itemsArb,
          fc.double({ min: -1000, max: 1000, noNaN: true }),
          fc.double({ min: -1000, max: 1000, noNaN: true }),
          (items, page, pageSize) => {
            const result = paginate(items, page, pageSize);

            expect(result.currentPage).toBeGreaterThanOrEqual(1);
            expect(result.currentPage).toBeLessThanOrEqual(result.pageCount);
            expect(result.items.length).toBeLessThanOrEqual(result.pageSize);
            expect(result.pageSize).toBeGreaterThanOrEqual(1);
            expect(Number.isInteger(result.pageSize)).toBe(true);
            expect(Number.isInteger(result.currentPage)).toBe(true);
          },
        ),
      );
    });

    it('never throws for negative, zero, or fractional page/pageSize', () => {
      fc.assert(
        fc.property(
          itemsArb,
          fc.double({ min: -1000, max: 1000, noNaN: true }),
          fc.double({ min: -1000, max: 1000, noNaN: true }),
          (items, page, pageSize) => {
            expect(() => paginate(items, page, pageSize)).not.toThrow();
          },
        ),
      );
    });

    it('pages through every item exactly once', () => {
      fc.assert(
        fc.property(
          itemsArb,
          fc.integer({ min: 1, max: 20 }),
          (items, pageSize) => {
            const pageCount = paginate(items, 1, pageSize).pageCount;
            const collected: number[] = [];

            for (let page = 1; page <= pageCount; page += 1) {
              collected.push(...paginate(items, page, pageSize).items);
            }

            expect(collected).toEqual(items);
          },
        ),
      );
    });
  });
});
