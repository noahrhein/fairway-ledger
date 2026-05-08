import type { Player, PairwiseDebt } from '../../types/index.js';

/**
 * Match Play (winner-takes-all) for 2 players.
 * Lowest total score wins the buy-in from the loser.
 * Tie = no debt.
 */
export function calculateMatch(
  players: Player[],
  scoresByPlayer: Record<string, number>,
  buyIn: number,
): PairwiseDebt[] {
  if (players.length !== 2 || buyIn <= 0) return [];
  const [a, b] = players;
  if (!a || !b) return [];
  const aScore = scoresByPlayer[a.id];
  const bScore = scoresByPlayer[b.id];
  if (!aScore || !bScore) return [];
  if (aScore === bScore) return [];
  if (aScore < bScore) return [{ from: b.id, to: a.id, amount: buyIn }];
  return [{ from: a.id, to: b.id, amount: buyIn }];
}
