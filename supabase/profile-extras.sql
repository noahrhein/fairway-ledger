-- Run this in Supabase SQL Editor (new query) on top of schema.sql.
-- Adds richer onboarding fields to profiles.

alter table profiles add column if not exists home_state text;
alter table profiles add column if not exists handicap numeric;
alter table profiles add column if not exists preferred_games text[] default '{}'::text[];
