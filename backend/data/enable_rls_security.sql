-- Migration: Enable Row Level Security (RLS) + harden functions
--
-- Establishes RLS as the access-control baseline for the public schema.
--
-- This migration:
--   1. Enables RLS on all public tables (default-deny for the anon role).
--   2. Adds the minimal anon policies the frontend actually relies on.
--   3. Pins search_path on SECURITY-relevant functions.
--
-- Server-side code uses the service-role key (supabaseAdmin / the Python
-- backend), which bypasses RLS, so API routes are unaffected. Tables with no
-- anon policy below are server-only by design.
--
-- Status: ALREADY APPLIED to the live database (2026-05-30). This file captures
-- it as a reproducible, reviewable migration of the schema as it was on that
-- date. It is a historical record, not a re-runnable script: the later
-- drop_dead_tables migration removed public.matches and public.product_pages,
-- so the two ALTERs referencing them below would now error. To recreate RLS on
-- the current schema, skip those two lines.

-- 1. Enable RLS on every public table -----------------------------------------
alter table public.companies               enable row level security;
alter table public.company_products        enable row level security;
alter table public.creator_tokens          enable row level security;
alter table public.creator_videos          enable row level security;
alter table public.matches                 enable row level security;
alter table public.partnerships            enable row level security;
alter table public.product_creator_matches enable row level security;
alter table public.product_matches         enable row level security;
alter table public.product_pages           enable row level security;
alter table public.reel_interactions       enable row level security;
alter table public.shopify_oauth_states    enable row level security;
alter table public.shopify_oauth_tokens    enable row level security;
alter table public.shopify_products        enable row level security;
alter table public.shopify_shops           enable row level security;
alter table public.waitlist                enable row level security;
alter table public.youtube_shorts          enable row level security;
alter table public.yt_shorts_all           enable row level security;
alter table public.yt_shorts_pending       enable row level security;

-- 2. Minimal anon (browser) policies ------------------------------------------
-- Only what the frontend reads/writes directly with the anon key.
-- Everything else is server-only (no anon policy => default deny).

-- Discover Shorts feed + matched products (public, read-only)
drop policy if exists "anon read" on public.creator_videos;
create policy "anon read" on public.creator_videos
  for select to anon using (true);

drop policy if exists "anon read" on public.product_creator_matches;
create policy "anon read" on public.product_creator_matches
  for select to anon using (true);

-- Reels archive view: read interactions + "un-archive" (delete) them.
-- NOTE: open to any anon caller because the app has no real per-user auth yet
-- (getCurrentUser() is a hardcoded demo mock). Tighten with a company_id check
-- once Supabase Auth is wired in.
drop policy if exists "anon read" on public.reel_interactions;
create policy "anon read" on public.reel_interactions
  for select to anon using (true);

drop policy if exists "anon delete" on public.reel_interactions;
create policy "anon delete" on public.reel_interactions
  for delete to anon using (true);

-- Waitlist signup form: INSERT only. Deliberately no SELECT policy so signup
-- emails are NOT readable from the browser.
drop policy if exists "anon insert" on public.waitlist;
create policy "anon insert" on public.waitlist
  for insert to anon with check (true);

-- youtube_shorts and yt_shorts_pending already carry a pre-existing public
-- SELECT policy ("Enable ... SELECT for all roles"); enabling RLS above simply
-- activates it. No new policy needed here.

-- 3. Harden function search_path ----------------------------------------------
-- Pin search_path so these functions can't be hijacked via a mutable path.
-- public is required for cleanup_expired_oauth_states (references
-- public.shopify_oauth_states unqualified); the others are pinned for
-- consistency.
alter function public.cleanup_expired_oauth_states()  set search_path = public;
alter function public.update_partnerships_updated_at() set search_path = public;
alter function public.random_slug_6()                 set search_path = public;
alter function public.update_updated_at_column()       set search_path = public;
