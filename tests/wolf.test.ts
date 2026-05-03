import { describe, it, expect } from 'vitest';
import { calculateWolf } from '../lib/betting/wolf.js';
import type { Player } from '../types/index.js';

const p = (id: string): Player => ({ id, name: id });

describe('calculateWolf', () => {
  it('all tied -> no debts', () => {
    const players = [p('a'), p('b'), p('c'), p('d')];
    const debts = calculateWolf(players, { a: 5, b: 5, c: 5, d: 5 }, 1);
    expect(debts).toEqual([]);
  });

  it('one player runs away with it', () => {
    const players = [p('a'), p('b'), p('c'), p('d')];
    const debts = calculateWolf(players, { a: 10, b: 2, c: 2, d: 2 }, 2);
    // a beats b/c/d by 8 each, b/c/d tie among themselves
    expect(debts).toHaveLength(3);
    expect(debts.every((d) => d.to === 'a' && d.amount === 16)).toBe(true);
  });

  it('mixed standings produce correct pairwise diffs', () => {
    const players = [p('a'), p('b'), p('c')];
    const debts = calculateWolf(players, { a: 8, b: 5, c: 2 }, 1);
    // a-b: 3, a-c: 6, b-c: 3
    expect(debts).toContainEqual({ from: 'b', to: 'a', amount: 3 });
    expect(debts).toContainEqual({ from: 'c', to: 'a', amount: 6 });
    expect(debts).toContainEqual({ from: 'c', to: 'b', amount: 3 });
  });

  it('respects stakePerPoint', () => {
    const players = [p('a'), p('b')];
    const debts = calculateWolf(players, { a: 7, b: 3 }, 5);
    expect(debts).toEqual([{ from: 'b', to: 'a', amount: 20 }]);
  });

  it('handles missing player entries as 0', () => {
    const players = [p('a'), p('b')];
    const debts = calculateWolf(players, { a: 4 }, 1);
    expect(debts).toEqual([{ from: 'b', to: 'a', amount: 4 }]);
  });
});
