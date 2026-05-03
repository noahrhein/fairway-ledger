import type { Player, Payout, PairwiseDebt } from '../../types/index.js';

export function simplifyDebts(debts: PairwiseDebt[], players: Player[]): Payout[] {
  const balances: Record<string, number> = {};
  for (const p of players) balances[p.id] = 0;
  for (const d of debts) {
    balances[d.from] = (balances[d.from] ?? 0) - d.amount;
    balances[d.to] = (balances[d.to] ?? 0) + d.amount;
  }

  const EPS = 0.005;
  const creditors = Object.entries(balances)
    .filter(([, v]) => v > EPS)
    .sort((a, b) => b[1] - a[1]);
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < -EPS)
    .sort((a, b) => a[1] - b[1]);

  const payouts: Payout[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci]!;
    const debtor = debtors[di]!;
    const amount = Math.min(creditor[1], -debtor[1]);
    const rounded = Math.round(amount * 100) / 100;
    if (rounded > 0) {
      payouts.push({
        id: crypto.randomUUID(),
        fromPlayerId: debtor[0],
        toPlayerId: creditor[0],
        amount: rounded,
        status: 'pending',
      });
    }
    creditor[1] -= amount;
    debtor[1] += amount;
    if (Math.abs(creditor[1]) < EPS) ci++;
    if (Math.abs(debtor[1]) < EPS) di++;
  }
  return payouts;
}
