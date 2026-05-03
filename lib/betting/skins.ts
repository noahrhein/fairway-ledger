import type { Player, PairwiseDebt } from '../../types/index.js';

export function calculateSkins(
  players: Player[],
  skinsByPlayer: Record<string, number>,
  stakePerSkin: number
): PairwiseDebt[] {
  const debts: PairwiseDebt[] = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i]!;
      const b = players[j]!;
      const diff = (skinsByPlayer[a.id] ?? 0) - (skinsByPlayer[b.id] ?? 0);
      if (diff > 0) debts.push({ from: b.id, to: a.id, amount: diff * stakePerSkin });
      else if (diff < 0) debts.push({ from: a.id, to: b.id, amount: -diff * stakePerSkin });
    }
  }
  return debts;
}
