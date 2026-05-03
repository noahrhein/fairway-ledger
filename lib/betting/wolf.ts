import type { Player, PairwiseDebt } from '../../types/index.js';

export function calculateWolf(
  players: Player[],
  pointsByPlayer: Record<string, number>,
  stakePerPoint: number
): PairwiseDebt[] {
  const debts: PairwiseDebt[] = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i]!;
      const b = players[j]!;
      const diff = (pointsByPlayer[a.id] ?? 0) - (pointsByPlayer[b.id] ?? 0);
      if (diff > 0) debts.push({ from: b.id, to: a.id, amount: diff * stakePerPoint });
      else if (diff < 0) debts.push({ from: a.id, to: b.id, amount: -diff * stakePerPoint });
    }
  }
  return debts;
}
