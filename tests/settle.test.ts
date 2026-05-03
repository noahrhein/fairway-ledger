import { describe, it, expect } from 'vitest';
import { simplifyDebts } from '../lib/betting/settle.js';
import { calculateNassau } from '../lib/betting/nassau.js';
import type { Player } from '../types/index.js';

const p = (id: string): Player => ({ id, name: id });

describe('simplifyDebts', () => {
  it('empty debts -> empty payouts', () => {
    expect(simplifyDebts([], [p('a'), p('b')])).toEqual([]);
  });

  it('collapses a chain a->b, b->c into a->c', () => {
    const players = [p('a'), p('b'), p('c')];
    const debts = [
      { from: 'a', to: 'b', amount: 10 },
      { from: 'b', to: 'c', amount: 10 },
    ];
    const payouts = simplifyDebts(debts, players);
    expect(payouts).toHaveLength(1);
    expect(payouts[0]).toMatchObject({ fromPlayerId: 'a', toPlayerId: 'c', amount: 10 });
  });

  it('cancels mutual debts', () => {
    const players = [p('a'), p('b')];
    const debts = [
      { from: 'a', to: 'b', amount: 10 },
      { from: 'b', to: 'a', amount: 4 },
    ];
    const payouts = simplifyDebts(debts, players);
    expect(payouts).toHaveLength(1);
    expect(payouts[0]).toMatchObject({ fromPlayerId: 'a', toPlayerId: 'b', amount: 6 });
  });

  it('foursome ranked outcome simplifies pairwise debts (6 -> <=3)', () => {
    const players = [p('a'), p('b'), p('c'), p('d')];
    const scores = {
      a: { f9: 36, b9: 36, total: 72 },
      b: { f9: 40, b9: 40, total: 80 },
      c: { f9: 42, b9: 42, total: 84 },
      d: { f9: 44, b9: 44, total: 88 },
    };
    const debts = calculateNassau(players, scores, { f9: 5, b9: 5, total: 10 });
    expect(debts).toHaveLength(6);
    const payouts = simplifyDebts(debts, players);
    // Net: a +60, b +20, c -20, d -60 -> greedy pairs to 2 payouts
    expect(payouts.length).toBeLessThanOrEqual(3);
    const totalSettled = payouts.reduce((s, p) => s + p.amount, 0);
    expect(totalSettled).toBe(80);
  });

  it('balances must sum to zero (conservation)', () => {
    const players = [p('a'), p('b'), p('c'), p('d')];
    const debts = [
      { from: 'a', to: 'b', amount: 7 },
      { from: 'c', to: 'd', amount: 13 },
      { from: 'a', to: 'c', amount: 5 },
    ];
    const payouts = simplifyDebts(debts, players);
    const net: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 };
    for (const p of payouts) {
      net[p.fromPlayerId]! -= p.amount;
      net[p.toPlayerId]! += p.amount;
    }
    expect(net.a).toBe(-12);
    expect(net.b).toBe(7);
    expect(net.c).toBe(-8);
    expect(net.d).toBe(13);
  });

  it('produces no more than n-1 transactions for n players', () => {
    const players = [p('a'), p('b'), p('c'), p('d')];
    const debts = [
      { from: 'a', to: 'b', amount: 5 },
      { from: 'a', to: 'c', amount: 5 },
      { from: 'a', to: 'd', amount: 5 },
      { from: 'b', to: 'c', amount: 5 },
      { from: 'b', to: 'd', amount: 5 },
      { from: 'c', to: 'd', amount: 5 },
    ];
    const payouts = simplifyDebts(debts, players);
    expect(payouts.length).toBeLessThanOrEqual(players.length - 1);
  });
});
