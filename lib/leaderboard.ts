import type { LeaderboardEntry, Round } from '../types';

/**
 * Aggregates a viewer-scoped leaderboard across rounds.
 * - Groups entries by claimed user_id when present, falling back to a
 *   case-insensitive name key for unclaimed players.
 * - Marks the entry whose user_id matches `viewerUserId` as `isYou`.
 */
export function computeLeaderboard(rounds: Round[], viewerUserId?: string | null): LeaderboardEntry[] {
  const byKey = new Map<string, LeaderboardEntry>();
  // Map round_player.id → grouping key, so payouts (which reference player ids)
  // can be attributed correctly.
  const playerIdToKey = new Map<string, string>();

  function keyFor(userId: string | null | undefined, name: string): string {
    return userId ? `u:${userId}` : `n:${name.trim().toLowerCase()}`;
  }

  for (const round of rounds) {
    const seenKeys = new Set<string>();
    for (const player of round.players) {
      const k = keyFor(player.userId, player.name);
      playerIdToKey.set(player.id, k);
      if (!byKey.has(k)) {
        byKey.set(k, {
          key: k,
          name: player.name,
          isYou: !!viewerUserId && player.userId === viewerUserId,
          net: 0,
          rounds: 0,
          paid: 0,
          received: 0,
        });
      } else {
        // Keep most-recent display name
        byKey.get(k)!.name = player.name;
      }
      seenKeys.add(k);
    }
    for (const k of seenKeys) byKey.get(k)!.rounds += 1;

    for (const payout of round.payouts ?? []) {
      const fromKey = playerIdToKey.get(payout.fromPlayerId);
      const toKey = playerIdToKey.get(payout.toPlayerId);
      if (fromKey) {
        const e = byKey.get(fromKey)!;
        e.paid += payout.amount;
        e.net -= payout.amount;
      }
      if (toKey) {
        const e = byKey.get(toKey)!;
        e.received += payout.amount;
        e.net += payout.amount;
      }
    }
  }

  return [...byKey.values()].sort((a, b) => b.net - a.net);
}
