-- ============================================================
-- Fairway Ledger schema
-- Run this once in Supabase Dashboard → SQL Editor
-- ============================================================

-- ----- Tables --------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  venmo_handle text,
  created_at timestamptz default now()
);

create table if not exists friends (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  friend_user_id uuid references auth.users(id),
  name text not null,
  venmo_handle text,
  created_at timestamptz default now()
);
create index if not exists friends_owner_idx on friends(owner_id);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  share_token uuid not null default gen_random_uuid() unique,
  course text not null,
  date date not null,
  format jsonb not null,
  results jsonb,
  settled boolean default false,
  created_at timestamptz default now()
);
create index if not exists rounds_owner_idx on rounds(owner_id);
create index if not exists rounds_share_token_idx on rounds(share_token);

create table if not exists round_players (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  user_id uuid references auth.users(id),
  name text not null,
  venmo_handle text,
  slot int not null,
  created_at timestamptz default now(),
  unique(round_id, slot)
);
create index if not exists rp_round_idx on round_players(round_id);
create index if not exists rp_user_idx on round_players(user_id);

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  from_player_id uuid not null references round_players(id) on delete cascade,
  to_player_id uuid not null references round_players(id) on delete cascade,
  amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending','settled')),
  created_at timestamptz default now()
);
create index if not exists payouts_round_idx on payouts(round_id);

-- ----- Helper (avoids recursive RLS) ---------------------------

create or replace function user_can_access_round(rid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from rounds where id = rid and owner_id = auth.uid()
  ) or exists (
    select 1 from round_players where round_id = rid and user_id = auth.uid()
  );
$$;

-- ----- Row Level Security --------------------------------------

alter table profiles      enable row level security;
alter table friends       enable row level security;
alter table rounds        enable row level security;
alter table round_players enable row level security;
alter table payouts       enable row level security;

-- profiles: anyone authenticated can read (for displaying names/handles in rounds);
-- only owner can write own row.
drop policy if exists profiles_select on profiles;
drop policy if exists profiles_insert on profiles;
drop policy if exists profiles_update on profiles;
create policy profiles_select on profiles for select using (auth.role() = 'authenticated');
create policy profiles_insert on profiles for insert with check (auth.uid() = id);
create policy profiles_update on profiles for update using (auth.uid() = id);

-- friends: only the owner sees / mutates.
drop policy if exists friends_all on friends;
create policy friends_all on friends for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- rounds: owner full access; participants can read.
drop policy if exists rounds_owner_all on rounds;
drop policy if exists rounds_player_read on rounds;
create policy rounds_owner_all on rounds for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
create policy rounds_player_read on rounds for select
  using (user_can_access_round(id));

-- round_players: anyone with access to the round can read; only owner writes.
drop policy if exists rp_read on round_players;
drop policy if exists rp_owner_write on round_players;
create policy rp_read on round_players for select
  using (user_can_access_round(round_id));
create policy rp_owner_write on round_players for all
  using (exists (select 1 from rounds where id = round_id and owner_id = auth.uid()))
  with check (exists (select 1 from rounds where id = round_id and owner_id = auth.uid()));

-- payouts: anyone with access reads; only owner writes (status toggle still goes through owner).
drop policy if exists payouts_read on payouts;
drop policy if exists payouts_owner_write on payouts;
create policy payouts_read on payouts for select
  using (user_can_access_round(round_id));
create policy payouts_owner_write on payouts for all
  using (exists (select 1 from rounds where id = round_id and owner_id = auth.uid()))
  with check (exists (select 1 from rounds where id = round_id and owner_id = auth.uid()));

-- ----- Share-link join: claim a slot via share token -----------

create or replace function claim_round_slot(token uuid, slot_idx int)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid;
  rp_id uuid;
begin
  select id into rid from rounds where share_token = token;
  if rid is null then
    raise exception 'invalid share token';
  end if;
  update round_players
    set user_id = auth.uid()
    where round_id = rid and slot = slot_idx and user_id is null
    returning id into rp_id;
  if rp_id is null then
    raise exception 'slot already claimed or not found';
  end if;
  return rp_id;
end;
$$;

-- ----- Auto-create profile row on signup -----------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
