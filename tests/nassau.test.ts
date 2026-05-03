import { describe, it, expect } from 'vitest';
import { calculateNassau } from '../lib/betting/nassau.js';
import type { Player } from '../types/index.js';

const p = (id: string): Player => ({ id, name: id });
const stakes = { f9: 5, b9: 5, total: 10 };

describe('calculateNassau', () => {
  it('returns no debts when all players tie on every segment', () => {
    const players = [p('a'), p('b')];
    const scores = {
      a: { f9: 40, b9: 40, total: 80 },
      b: { f9: 40, b9: 40, total: 80 },
    };
    expect(calculateNassau(players, scores, stakes)).toEqual([]);
  });

  it('two players, one sweeps all three segments', () => {
    const players = [p('a'), p('b')];
    const scores = {
      a: { f9: 38, b9: 39, total: 77 },
      b: { f9: 42, b9: 43, total: 85 },
    };
    const debts = calculateNassau(players, scores, stakes);
    expect(debts).toEqual([{ from: 'b', to: 'a', amount: 20 }]);
  });

  it('split segments: A wins F9, B wins B9, tie on total', () => {
    const players = [p('a'), p('b')];
    const scores = {
      a: { f9: 38, b9: 44, total: 82 },
      b: { f9: 42, b9: 40, total: 82 },
    };
    // F9: +5 to A, B9: -5 to A, total: 0 -> net 0
    expect(calculateNassau(players, scores, stakes)).toEqual([]);
  });

  it('foursome produces one debt per losing pair', () => {
    const players = [p('a'), p('b'), p('c'), p('d')];
    const scores = {
      a: { f9: 38, b9: 38, total: 76 },
      b: { f9: 40, b9: 40, total: 80 },
      c: { f9: 42, b9: 42, total: 84 },
      d: { f9: 44, b9: 44, total: 88 },
    };
    const debts = calculateNassau(players, scores, stakes);
    // 6 pairs, A beats all, B beats c/d, C beats d
    expect(debts).toHaveLength(6);
    const aWins = debts.filter((d) => d.to === 'a');
    expect(aWins).toHaveLength(3);
    expect(aWins.every((d) => d.amount === 20)).toBe(true);
  });

  it('handles a 3-player round', () => {
    const players = [p('a'), p('b'), p('c')];
    const scores = {
      a: { f9: 38, b9: 38, total: 76 },
      b: { f9: 38, b9: 38, total: 76 },
      c: { f9: 50, b9: 50, total: 100 },
    };
    const debts = calculateNassau(players, scores, stakes);
    // a vs b tie, a beats c, b beats c
    expect(debts).toHaveLength(2);
    expect(debts.every((d) => d.from === 'c' && d.amount === 20)).toBe(true);
  });
});
