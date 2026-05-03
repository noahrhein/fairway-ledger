import type { Player, PairwiseDebt } from '../../types/index.js';

export function calculateNassau(
  players: Player[],
  scores: Record<string, { f9: number; b9: number; total: number }>,
  stakes: { f9: number; b9: number; total: number }
): PairwiseDebt[] {
  const debts: PairwiseDebt[] = [];
  const segments = ['f9', 'b9', 'total'] as const;

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i]!;
      const b = players[j]!;
      const aScore = scores[a.id];
      const bScore = scores[b.id];
      if (!aScore || !bScore) continue;

      let net = 0;
      for (const seg of segments) {
        if (aScore[seg] < bScore[seg]) net += stakes[seg];
        else if (aScore[seg] > bScore[seg]) net -= stakes[seg];
      }
      if (net > 0) debts.push({ from: b.id, to: a.id, amount: net });
      else if (net < 0) debts.push({ from: a.id, to: b.id, amount: -net });
    }
  }
  return debts;
}
