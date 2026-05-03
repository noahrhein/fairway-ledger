export type Player = {
  id: string;
  name: string;
  venmoHandle?: string;
};

export type BetFormat =
  | { type: 'nassau'; stakes: { f9: number; b9: number; total: number } }
  | { type: 'skins'; stakePerSkin: number }
  | { type: 'wolf'; stakePerPoint: number };

export type RoundResults =
  | { type: 'nassau'; scores: Record<string, { f9: number; b9: number; total: number }> }
  | { type: 'skins'; skinsByPlayer: Record<string, number> }
  | { type: 'wolf'; pointsByPlayer: Record<string, number> };

export type Payout = {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
  status: 'pending' | 'settled';
};

export type Round = {
  id: string;
  date: string;
  course: string;
  players: Player[];
  format: BetFormat;
  results?: RoundResults;
  payouts?: Payout[];
  settled: boolean;
  createdAt: string;
};

export type PairwiseDebt = { from: string; to: string; amount: number };

export type Friend = {
  id: string;
  name: string;
  venmoHandle?: string;
  createdAt: string;
};

export const YOU_ID = 'you';

export type LeaderboardEntry = {
  friendId: string;
  name: string;
  net: number;
  rounds: number;
  paid: number;
  received: number;
};
