import type { LeaderboardEntry, Round } from '../types';

export function computeLeaderboard(rounds: Round[]): LeaderboardEntry[] {
  const byId = new Map<string, LeaderboardEntry>();

  for (const round of rounds) {
    const seen = new Set<string>();
    for (const player of round.players) {
      seen.add(player.id);
      if (!byId.has(player.id)) {
        byId.set(player.id, {
          friendId: player.id,
          name: player.name,
          net: 0,
          rounds: 0,
          paid: 0,
          received: 0,
        });
      } else {
        // Keep the most recent display name
        byId.get(player.id)!.name = player.name;
      }
    }
    for (const id of seen) byId.get(id)!.rounds += 1;

    for (const payout of round.payouts ?? []) {
      const from = byId.get(payout.fromPlayerId);
      const to = byId.get(payout.toPlayerId);
      if (from) {
        from.paid += payout.amount;
        from.net -= payout.amount;
      }
      if (to) {
        to.received += payout.amount;
        to.net += payout.amount;
      }
    }
  }

  return [...byId.values()].sort((a, b) => b.net - a.net);
}
