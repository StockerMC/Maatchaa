-- Migration: Phase 1 schema cleanup — drop confirmed-dead tables
--
-- See docs/schema-redesign.md for the full evaluation. These two tables are the
-- only "safe now" deletions: both have 0 rows, 0 inbound foreign keys, and no
-- references in any application code (frontend or backend).
--
--   public.product_pages  — superseded by youtube_shorts as the public showcase
--                           page; never referenced anywhere. 0 rows.
--   public.matches        — v1 of the matching pipeline; replaced by
--                           product_creator_matches. Only a coincidental dict
--                           key "matches" exists in code, no table calls. 0 rows.
--
-- Verified pre-drop (2026-05-31): both tables 0 rows, 0 inbound FK constraints.
--
-- Status: applied to the live DB via Supabase MCP on 2026-05-31.
-- Idempotent: uses IF EXISTS.

drop table if exists public.product_pages;
drop table if exists public.matches;

-- Note: public.matches depends on the match_status enum. The enum is left in
-- place (harmless if unused); drop separately only if confirmed unused elsewhere:
--   drop type if exists match_status;
