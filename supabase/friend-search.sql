-- Run this in Supabase SQL Editor (new query) on top of schema.sql.
-- Adds an RPC for searching other Fairway users by display name so users
-- can add each other as friends without typing UUIDs/emails.

-- Make sure onboarded_at exists (idempotent; safe to re-run).
alter table profiles add column if not exists onboarded_at timestamptz;

-- search_users(q): returns at most 10 onboarded users whose display_name
-- matches the case-insensitive substring `q`. Excludes the caller and
-- anyone the caller has already friended.
create or replace function search_users(q text)
returns table (id uuid, display_name text, home_state text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if char_length(coalesce(trim(q), '')) < 2 then
    return;
  end if;
  return query
  select p.id, p.display_name, p.home_state
  from profiles p
  where p.id <> auth.uid()
    and p.onboarded_at is not null
    and p.display_name is not null
    and p.display_name <> ''
    and p.display_name ilike '%' || trim(q) || '%'
    and not exists (
      select 1 from friends f
      where f.owner_id = auth.uid()
        and f.friend_user_id = p.id
    )
  order by p.display_name
  limit 10;
end;
$$;

grant execute on function search_users(text) to authenticated;
