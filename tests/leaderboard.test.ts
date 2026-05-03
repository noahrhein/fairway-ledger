import { describe, it, expect } from 'vitest';
import { computeLeaderboard } from '../lib/leaderboard';
import type { Round } from '../types';

function round(id: string, players: { id: string; name: string }[], payouts: { from: string; to: string; amount: number }[]): Round {
  return {
    id,
    date: '2026-01-01T00:00:00Z',
    course: 'Test',
    players: players.map((p) => ({ id: p.id, name: p.name })),
    format: { type: 'skins', stakePerSkin: 1 },
    settled: false,
    createdAt: '2026-01-01T00:00:00Z',
    payouts: payouts.map((p, i) => ({
      id: String(i),
      fromPlayerId: p.from,
      toPlayerId: p.to,
      amount: p.amount,
      status: 'pending' as const,
    })),
  };
}

describe('computeLeaderboard', () => {
  it('empty rounds -> empty leaderboard', () => {
    expect(computeLeaderboard([])).toEqual([]);
  });

  it('aggregates net winnings across rounds and sorts by net desc', () => {
    const rounds: Round[] = [
      round('r1', [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], [{ from: 'b', to: 'a', amount: 20 }]),
      round('r2', [{ id: 'a', name: 'A' }, { id: 'c', name: 'C' }], [{ from: 'a', to: 'c', amount: 5 }]),
      round('r3', [{ id: 'b', name: 'B' }, { id: 'c', name: 'C' }], [{ from: 'c', to: 'b', amount: 10 }]),
    ];
    const lb = computeLeaderboard(rounds);
    const map = Object.fromEntries(lb.map((e) => [e.friendId, e]));
    expect(map.a!.net).toBe(15);
    expect(map.a!.rounds).toBe(2);
    expect(map.a!.received).toBe(20);
    expect(map.a!.paid).toBe(5);
    expect(map.b!.net).toBe(-10); // -20 + 10
    expect(map.b!.rounds).toBe(2);
    expect(map.c!.net).toBe(-5); // +5 - 10
    expect(lb[0]!.friendId).toBe('a');
  });

  it('counts a player once per round even if they appear in multiple payouts', () => {
    const rounds: Round[] = [
      round('r1', [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
        { id: 'c', name: 'C' },
      ], [
        { from: 'b', to: 'a', amount: 10 },
        { from: 'c', to: 'a', amount: 10 },
      ]),
    ];
    const lb = computeLeaderboard(rounds);
    const a = lb.find((e) => e.friendId === 'a')!;
    expect(a.rounds).toBe(1);
    expect(a.received).toBe(20);
    expect(a.net).toBe(20);
  });

  it('includes players with no payouts (round had no results yet)', () => {
    const rounds: Round[] = [
      {
        ...round('r1', [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], []),
        payouts: undefined,
      },
    ];
    const lb = computeLeaderboard(rounds);
    expect(lb).toHaveLength(2);
    expect(lb.every((e) => e.net === 0 && e.rounds === 1)).toBe(true);
  });

  it('uses the most recent name when a player appears under different names', () => {
    const rounds: Round[] = [
      round('r1', [{ id: 'a', name: 'Andy' }, { id: 'b', name: 'B' }], []),
      round('r2', [{ id: 'a', name: 'Andrew' }, { id: 'b', name: 'B' }], []),
    ];
    const lb = computeLeaderboard(rounds);
    expect(lb.find((e) => e.friendId === 'a')!.name).toBe('Andrew');
  });

  it('total net across leaderboard sums to zero (conservation)', () => {
    const rounds: Round[] = [
      round('r1', [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }, { id: 'd', name: 'D' }], [
        { from: 'd', to: 'a', amount: 60 },
        { from: 'c', to: 'b', amount: 20 },
      ]),
    ];
    const lb = computeLeaderboard(rounds);
    const total = lb.reduce((s, e) => s + e.net, 0);
    expect(total).toBe(0);
  });
});
