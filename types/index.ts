export type Player = {
  id: string;            // round_players.id (uuid)
  userId?: string | null; // auth user id if claimed
  name: string;
  venmoHandle?: string;
};

export type BetFormat =
  | { type: 'nassau'; stakes: { f9: number; b9: number; total: number } }
  | { type: 'skins'; stakePerSkin: number }
  | { type: 'wolf'; stakePerPoint: number }
  | { type: 'match'; buyIn: number };

export type RoundResults =
  | { type: 'nassau'; scores: Record<string, { f9: number; b9: number; total: number }> }
  | { type: 'skins'; skinsByPlayer: Record<string, number> }
  | { type: 'wolf'; pointsByPlayer: Record<string, number> }
  | { type: 'match'; scoresByPlayer: Record<string, number> };

export type SideBet = {
  id: string;
  description: string;
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
};

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
  sideBets?: SideBet[];
  settled: boolean;
  createdAt: string;
  ownerId: string;
  shareToken: string;
};

export type PairwiseDebt = { from: string; to: string; amount: number };

export type Friend = {
  id: string;
  name: string;
  venmoHandle?: string;
  friendUserId?: string | null;
  createdAt: string;
};

export type GameKey = 'nassau' | 'skins' | 'wolf' | 'match' | 'stroke' | 'stableford';

export type Profile = {
  id: string;
  displayName: string;
  venmoHandle?: string | null;
  homeState?: string | null;
  handicap?: number | null;
  preferredGames?: GameKey[];
};

export type LeaderboardEntry = {
  key: string;        // user_id if claimed, else `name:<name>`
  name: string;
  isYou: boolean;
  net: number;
  rounds: number;
  paid: number;
  received: number;
};
