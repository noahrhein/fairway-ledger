import { describe, it, expect } from 'vitest';
import { calculateSkins } from '../lib/betting/skins.js';
import type { Player } from '../types/index.js';

const p = (id: string): Player => ({ id, name: id });

describe('calculateSkins', () => {
  it('all tied -> no debts', () => {
    const players = [p('a'), p('b'), p('c')];
    const debts = calculateSkins(players, { a: 3, b: 3, c: 3 }, 2);
    expect(debts).toEqual([]);
  });

  it('one clear winner in a foursome', () => {
    const players = [p('a'), p('b'), p('c'), p('d')];
    const debts = calculateSkins(players, { a: 6, b: 0, c: 0, d: 0 }, 5);
    expect(debts).toHaveLength(3);
    expect(debts.every((d) => d.to === 'a' && d.amount === 30)).toBe(true);
  });

  it('two-way tie at the top: only third/fourth owe', () => {
    const players = [p('a'), p('b'), p('c'), p('d')];
    const debts = calculateSkins(players, { a: 4, b: 4, c: 1, d: 1 }, 10);
    // a-b tie, c-d tie. a>c, a>d, b>c, b>d
    expect(debts).toHaveLength(4);
    expect(debts.filter((d) => d.amount !== 30)).toHaveLength(0);
  });

  it('2-player round', () => {
    const players = [p('a'), p('b')];
    const debts = calculateSkins(players, { a: 5, b: 2 }, 4);
    expect(debts).toEqual([{ from: 'b', to: 'a', amount: 12 }]);
  });

  it('losing player owes', () => {
    const players = [p('a'), p('b')];
    const debts = calculateSkins(players, { a: 1, b: 7 }, 3);
    expect(debts).toEqual([{ from: 'a', to: 'b', amount: 18 }]);
  });
});
