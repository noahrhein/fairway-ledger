-- Run this in Supabase SQL Editor on top of schema.sql.
-- Adds side_bets table for pairwise extra wagers within a round.

create table if not exists side_bets (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade not null,
  description text,
  from_player_id uuid references round_players(id) on delete cascade not null,
  to_player_id uuid references round_players(id) on delete cascade not null,
  amount numeric not null check (amount > 0),
  created_at timestamptz default now() not null
);

create index if not exists side_bets_round_id_idx on side_bets(round_id);

alter table side_bets enable row level security;

-- Anyone who can access the round can read its side bets.
drop policy if exists "side bets readable by round members" on side_bets;
create policy "side bets readable by round members"
on side_bets for select
using (user_can_access_round(round_id));

-- Only the round owner can write side bets.
drop policy if exists "side bets writable by owner" on side_bets;
create policy "side bets writable by owner"
on side_bets for all
using (
  exists (
    select 1 from rounds r
    where r.id = side_bets.round_id and r.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from rounds r
    where r.id = side_bets.round_id and r.owner_id = auth.uid()
  )
);
