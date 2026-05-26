-- Run this in Supabase SQL Editor (new query) on top of schema.sql.
-- Adds a definitive "has finished onboarding" marker.
-- Detection becomes: onboarded_at IS NULL  -> show onboarding.

alter table profiles add column if not exists onboarded_at timestamptz;

-- Backfill: anyone who already has a non-empty, non-email-prefix display_name
-- is considered onboarded so they don't get prompted again.
update profiles p
set onboarded_at = now()
where onboarded_at is null
  and display_name is not null
  and display_name <> ''
  and exists (
    select 1 from auth.users u
    where u.id = p.id and split_part(u.email, '@', 1) <> p.display_name
  );
