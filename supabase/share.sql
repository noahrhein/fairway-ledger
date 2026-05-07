-- Run this in Supabase SQL Editor on top of schema.sql.
-- Lets any authenticated user fetch a round by share_token (so they
-- can see who's playing and pick an unclaimed slot to join as).

create or replace function get_round_by_token(token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r rounds%rowtype;
  players_json jsonb;
begin
  select * into r from rounds where share_token = token;
  if r.id is null then
    return null;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', rp.id,
    'name', rp.name,
    'venmo_handle', rp.venmo_handle,
    'slot', rp.slot,
    'user_id', rp.user_id
  ) order by rp.slot), '[]'::jsonb) into players_json
  from round_players rp where rp.round_id = r.id;

  return jsonb_build_object(
    'id', r.id,
    'course', r.course,
    'date', r.date,
    'format', r.format,
    'owner_id', r.owner_id,
    'players', players_json
  );
end;
$$;

grant execute on function get_round_by_token(uuid) to authenticated;
grant execute on function claim_round_slot(uuid, int) to authenticated;
