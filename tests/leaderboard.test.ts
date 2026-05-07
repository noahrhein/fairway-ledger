import { describe, it, expect } from 'vitest';
import { computeLeaderboard } from '../lib/leaderboard';
import type { Round } from '../types';

function round(
  id: string,
  players: { id: string; name: string; userId?: string }[],
  payouts: { from: string; to: string; amount: number }[],
): Round {
  return {
    id,
    ownerId: 'owner-1',
    shareToken: 'tok-' + id,
    date: '2026-01-01',
    course: 'Test',
    players: players.map((p) => ({ id: p.id, name: p.name, userId: p.userId ?? null })),
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

const k = (name: string) => `n:${name.toLowerCase()}`;

describe('computeLeaderboard', () => {
  it('empty rounds -> empty leaderboard', () => {
    expect(computeLeaderboard([])).toEqual([]);
  });

  it('aggregates net winnings across rounds and sorts by net desc', () => {
    const rounds: Round[] = [
      round('r1', [{ id: 'a1', name: 'A' }, { id: 'b1', name: 'B' }], [{ from: 'b1', to: 'a1', amount: 20 }]),
      round('r2', [{ id: 'a2', name: 'A' }, { id: 'c1', name: 'C' }], [{ from: 'a2', to: 'c1', amount: 5 }]),
      round('r3', [{ id: 'b2', name: 'B' }, { id: 'c2', name: 'C' }], [{ from: 'c2', to: 'b2', amount: 10 }]),
    ];
    const lb = computeLeaderboard(rounds);
    const map = Object.fromEntries(lb.map((e) => [e.key, e]));
    expect(map[k('A')]!.net).toBe(15);
    expect(map[k('A')]!.rounds).toBe(2);
    expect(map[k('A')]!.received).toBe(20);
    expect(map[k('A')]!.paid).toBe(5);
    expect(map[k('B')]!.net).toBe(-10);
    expect(map[k('B')]!.rounds).toBe(2);
    expect(map[k('C')]!.net).toBe(-5);
    expect(lb[0]!.key).toBe(k('A'));
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
    const a = lb.find((e) => e.key === k('A'))!;
    expect(a.rounds).toBe(1);
    expect(a.received).toBe(20);
    expect(a.net).toBe(20);
  });

  it('includes players with no payouts', () => {
    const rounds: Round[] = [
      { ...round('r1', [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], []), payouts: undefined },
    ];
    const lb = computeLeaderboard(rounds);
    expect(lb).toHaveLength(2);
    expect(lb.every((e) => e.net === 0 && e.rounds === 1)).toBe(true);
  });

  it('groups by user_id across name changes when claimed', () => {
    const rounds: Round[] = [
      round('r1', [{ id: 'a1', name: 'Andy', userId: 'u1' }, { id: 'b1', name: 'B' }], []),
      round('r2', [{ id: 'a2', name: 'Andrew', userId: 'u1' }, { id: 'b2', name: 'B' }], []),
    ];
    const lb = computeLeaderboard(rounds);
    const u = lb.find((e) => e.key === 'u:u1')!;
    expect(u).toBeTruthy();
    expect(u.name).toBe('Andrew'); // most recent name
    expect(u.rounds).toBe(2);
  });

  it('marks viewer as isYou when their userId matches', () => {
    const rounds: Round[] = [
      round('r1', [{ id: 'a', name: 'Me', userId: 'me' }, { id: 'b', name: 'B' }], []),
    ];
    const lb = computeLeaderboard(rounds, 'me');
    expect(lb.find((e) => e.isYou)?.name).toBe('Me');
  });

  it('total net sums to zero (conservation)', () => {
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
