'use client';

import { createClient } from './supabase/client';
import type {
  BetFormat,
  Friend,
  Payout,
  Profile,
  Round,
  RoundResults,
} from '../types';

// ----- Types matching DB rows ----------------------------------

type RoundRow = {
  id: string;
  owner_id: string;
  share_token: string;
  course: string;
  date: string;
  format: BetFormat;
  results: RoundResults | null;
  settled: boolean;
  created_at: string;
};

type RoundPlayerRow = {
  id: string;
  round_id: string;
  user_id: string | null;
  name: string;
  venmo_handle: string | null;
  slot: number;
};

type PayoutRow = {
  id: string;
  round_id: string;
  from_player_id: string;
  to_player_id: string;
  amount: number;
  status: 'pending' | 'settled';
};

// ----- Helpers --------------------------------------------------

function rowsToRound(
  round: RoundRow,
  players: RoundPlayerRow[],
  payouts: PayoutRow[],
): Round {
  return {
    id: round.id,
    ownerId: round.owner_id,
    shareToken: round.share_token,
    course: round.course,
    date: round.date,
    format: round.format,
    results: round.results ?? undefined,
    settled: round.settled,
    createdAt: round.created_at,
    players: players
      .sort((a, b) => a.slot - b.slot)
      .map((p) => ({
        id: p.id,
        userId: p.user_id,
        name: p.name,
        venmoHandle: p.venmo_handle ?? undefined,
      })),
    payouts: payouts.map((p) => ({
      id: p.id,
      fromPlayerId: p.from_player_id,
      toPlayerId: p.to_player_id,
      amount: Number(p.amount),
      status: p.status,
    })),
  };
}

// ----- Auth / profile -------------------------------------------

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, venmo_handle')
    .eq('id', user.id)
    .single();
  if (!data) return null;
  return { id: data.id, displayName: data.display_name, venmoHandle: data.venmo_handle };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

// ----- Rounds ---------------------------------------------------

export async function getRounds(): Promise<Round[]> {
  const supabase = createClient();
  const { data: rounds, error } = await supabase
    .from('rounds')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !rounds) return [];
  if (rounds.length === 0) return [];

  const roundIds = rounds.map((r) => r.id);
  const [{ data: players }, { data: payouts }] = await Promise.all([
    supabase.from('round_players').select('*').in('round_id', roundIds),
    supabase.from('payouts').select('*').in('round_id', roundIds),
  ]);

  return rounds.map((r) =>
    rowsToRound(
      r as RoundRow,
      ((players ?? []) as RoundPlayerRow[]).filter((p) => p.round_id === r.id),
      ((payouts ?? []) as PayoutRow[]).filter((p) => p.round_id === r.id),
    ),
  );
}

export async function getRound(id: string): Promise<Round | null> {
  const supabase = createClient();
  const [{ data: round }, { data: players }, { data: payouts }] = await Promise.all([
    supabase.from('rounds').select('*').eq('id', id).single(),
    supabase.from('round_players').select('*').eq('round_id', id),
    supabase.from('payouts').select('*').eq('round_id', id),
  ]);
  if (!round) return null;
  return rowsToRound(round as RoundRow, (players ?? []) as RoundPlayerRow[], (payouts ?? []) as PayoutRow[]);
}

export type NewPlayerInput = {
  name: string;
  venmoHandle?: string;
  // If this slot is the signed-in user, set userId to their auth id.
  userId?: string | null;
};

export async function createRound(input: {
  course: string;
  date: string;
  format: BetFormat;
  players: NewPlayerInput[];
}): Promise<Round | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: round, error: rErr } = await supabase
    .from('rounds')
    .insert({
      owner_id: user.id,
      course: input.course,
      date: input.date,
      format: input.format,
      settled: false,
    })
    .select('*')
    .single();
  if (rErr || !round) return null;

  const playerRows = input.players.map((p, slot) => ({
    round_id: round.id,
    user_id: p.userId ?? null,
    name: p.name,
    venmo_handle: p.venmoHandle ?? null,
    slot,
  }));

  const { data: insertedPlayers, error: pErr } = await supabase
    .from('round_players')
    .insert(playerRows)
    .select('*');
  if (pErr || !insertedPlayers) {
    await supabase.from('rounds').delete().eq('id', round.id);
    return null;
  }

  return rowsToRound(round as RoundRow, insertedPlayers as RoundPlayerRow[], []);
}

export async function saveRoundResults(
  roundId: string,
  results: RoundResults,
  payouts: Omit<Payout, 'id' | 'status'>[],
): Promise<void> {
  const supabase = createClient();
  await supabase.from('rounds').update({ results, settled: false }).eq('id', roundId);
  // replace payouts
  await supabase.from('payouts').delete().eq('round_id', roundId);
  if (payouts.length === 0) return;
  await supabase.from('payouts').insert(
    payouts.map((p) => ({
      round_id: roundId,
      from_player_id: p.fromPlayerId,
      to_player_id: p.toPlayerId,
      amount: p.amount,
      status: 'pending',
    })),
  );
}

export async function togglePayout(payoutId: string, roundId: string): Promise<void> {
  const supabase = createClient();
  const { data: current } = await supabase
    .from('payouts')
    .select('status')
    .eq('id', payoutId)
    .single();
  const next = current?.status === 'settled' ? 'pending' : 'settled';
  await supabase.from('payouts').update({ status: next }).eq('id', payoutId);

  // If all payouts now settled, mark round.settled = true
  const { data: rest } = await supabase
    .from('payouts')
    .select('status')
    .eq('round_id', roundId);
  const allSettled = (rest ?? []).length > 0 && (rest ?? []).every((p) => p.status === 'settled');
  await supabase.from('rounds').update({ settled: allSettled }).eq('id', roundId);
}

export async function deleteRound(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('rounds').delete().eq('id', id);
}

// ----- Friends --------------------------------------------------

export async function getFriends(): Promise<Friend[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('friends')
    .select('*')
    .order('name', { ascending: true });
  if (error || !data) return [];
  return data.map((f) => ({
    id: f.id,
    name: f.name,
    venmoHandle: f.venmo_handle ?? undefined,
    friendUserId: f.friend_user_id,
    createdAt: f.created_at,
  }));
}

export async function saveFriend(input: {
  id?: string;
  name: string;
  venmoHandle?: string;
}): Promise<Friend | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (input.id) {
    const { data } = await supabase
      .from('friends')
      .update({ name: input.name, venmo_handle: input.venmoHandle ?? null })
      .eq('id', input.id)
      .select('*')
      .single();
    if (!data) return null;
    return {
      id: data.id, name: data.name, venmoHandle: data.venmo_handle ?? undefined,
      friendUserId: data.friend_user_id, createdAt: data.created_at,
    };
  }
  const { data } = await supabase
    .from('friends')
    .insert({ owner_id: user.id, name: input.name, venmo_handle: input.venmoHandle ?? null })
    .select('*')
    .single();
  if (!data) return null;
  return {
    id: data.id, name: data.name, venmoHandle: data.venmo_handle ?? undefined,
    friendUserId: data.friend_user_id, createdAt: data.created_at,
  };
}

export async function deleteFriend(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('friends').delete().eq('id', id);
}

export async function findOrCreateFriendByName(
  name: string,
  venmoHandle?: string,
): Promise<Friend | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from('friends')
    .select('*')
    .eq('owner_id', user.id)
    .ilike('name', trimmed)
    .limit(1);
  if (existing && existing.length > 0) {
    const f = existing[0];
    if (venmoHandle && !f.venmo_handle) {
      await supabase.from('friends').update({ venmo_handle: venmoHandle }).eq('id', f.id);
      f.venmo_handle = venmoHandle;
    }
    return {
      id: f.id, name: f.name, venmoHandle: f.venmo_handle ?? undefined,
      friendUserId: f.friend_user_id, createdAt: f.created_at,
    };
  }
  return saveFriend({ name: trimmed, venmoHandle });
}

// ----- Share / claim --------------------------------------------

export type SharePreview = {
  id: string;
  course: string;
  date: string;
  format: BetFormat;
  ownerId: string;
  players: { id: string; name: string; venmoHandle: string | null; slot: number; userId: string | null }[];
};

export async function getRoundByShareToken(token: string): Promise<SharePreview | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_round_by_token', { token });
  if (error || !data) return null;
  return {
    id: data.id,
    course: data.course,
    date: data.date,
    format: data.format,
    ownerId: data.owner_id,
    players: (data.players ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      venmoHandle: p.venmo_handle,
      slot: p.slot,
      userId: p.user_id,
    })),
  };
}

export async function claimRoundSlot(token: string, slotIdx: number): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('claim_round_slot', {
    token,
    slot_idx: slotIdx,
  });
  if (error) return null;
  return data as string;
}
