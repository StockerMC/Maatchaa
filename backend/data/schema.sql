-- =============================================================================
-- Maatchaa — current database schema (public schema)
--
-- This file is a faithful snapshot of the LIVE Supabase database, regenerated
-- from the running instance. The previous version of this file was stale (it
-- predated most tables/columns and carried a "FIXME: actually update our DB"
-- note). A fresh database created from this file should structurally match prod.
--
-- Tables are annotated with their real-world status:
--   [ACTIVE]  used by the running app (frontend and/or backend)
--   [LEGACY]  older pipeline, ~0 rows, still referenced in backend/API.py
--   [DEAD]    no code references and no data — safe drop candidate
--   [WORKER]  background-pipeline scratch/staging (ideally not in `public`)
--
-- A proposed cleaner schema and a phased migration plan live in
-- docs/schema-redesign.md. THIS file documents reality as-is; it does not
-- redesign anything.
--
-- RLS: row level security is enabled on every table here (see the RLS section
-- at the bottom, and backend/data/enable_rls_security.sql for the migration
-- that introduced it).
-- =============================================================================

-- Extensions in use --------------------------------------------------------- --
create extension if not exists "uuid-ossp";   -- uuid_generate_v4()
create extension if not exists "pgcrypto";     -- gen_random_uuid()

-- Enums --------------------------------------------------------------------- --
do $$ begin
  create type match_status as enum ('awaiting', 'success', 'rejected');
exception when duplicate_object then null; end $$;


-- =============================================================================
-- IDENTITY
-- =============================================================================

-- [ACTIVE] Merchant / Shopify store owner. NOTE: this is one of THREE tables
-- describing a merchant (also shopify_shops + shopify_oauth_tokens); access_token
-- is duplicated between companies and shopify_oauth_tokens. See redesign doc.
create table companies (
    company_id          uuid primary key default gen_random_uuid(),
    shop_name           text not null,
    access_token        text not null,                         -- SENSITIVE
    ingested            boolean not null default false,
    last_ingest_attempt timestamptz,
    keywords            text[],
    created_at          timestamptz not null default timezone('utc', now()),
    updated_at          timestamptz
);

-- [ACTIVE] Shopify store metadata (rich profile). Separate from `companies`.
create table shopify_shops (
    id                         uuid primary key default uuid_generate_v4(),
    company_id                 uuid,
    shop_domain                text not null unique,
    shop_id                    bigint,
    shop_name                  text,
    shop_owner                 text,
    email                      text,
    domain                     text,
    country                    text,
    currency                   text,
    timezone                   text,
    iana_timezone              text,
    plan_name                  text,
    plan_display_name          text,
    shop_created_at            timestamptz,
    province                   text,
    city                       text,
    address1                   text,
    zip                        text,
    phone                      text,
    latitude                   numeric,
    longitude                  numeric,
    primary_locale             text,
    money_format               text,
    money_with_currency_format text,
    weight_unit                text,
    myshopify_domain           text,
    last_synced_at             timestamptz,
    created_at                 timestamptz default now(),
    updated_at                 timestamptz default now()
);
create index idx_shopify_shops_company_id  on shopify_shops (company_id);
create index idx_shopify_shops_shop_domain on shopify_shops (shop_domain);

-- [ACTIVE] Shopify OAuth access tokens. access_token also lives on companies.
create table shopify_oauth_tokens (
    id                uuid primary key default uuid_generate_v4(),
    company_id        uuid,
    shop_domain       text not null unique,
    access_token      text not null,                           -- SENSITIVE
    scope             text not null,
    token_type        text default 'offline',
    is_active         boolean default true,
    products_synced   boolean default false,
    last_product_sync timestamptz,
    product_count     integer default 0,
    expires_at        timestamptz,
    created_at        timestamptz default now(),
    updated_at        timestamptz default now()
);
create index idx_shopify_oauth_tokens_company_id  on shopify_oauth_tokens (company_id);
create index idx_shopify_oauth_tokens_shop_domain on shopify_oauth_tokens (shop_domain);
create index idx_shopify_oauth_tokens_is_active   on shopify_oauth_tokens (is_active);

-- [ACTIVE] Short-lived CSRF state for the Shopify OAuth handshake.
create table shopify_oauth_states (
    id           uuid primary key default uuid_generate_v4(),
    state        text not null unique,
    company_id   uuid,
    shop_domain  text not null,
    redirect_url text,
    used         boolean default false,
    created_at   timestamptz default now(),
    expires_at   timestamptz default now() + interval '10 minutes'
);
create index idx_shopify_oauth_states_state      on shopify_oauth_states (state);
create index idx_shopify_oauth_states_company_id on shopify_oauth_states (company_id);
create index idx_shopify_oauth_states_expires_at on shopify_oauth_states (expires_at);

-- [ACTIVE] Creator (YouTube) OAuth tokens. Creator identity is otherwise smeared
-- across creator_videos / partnerships as loose columns (no `creators` table).
create table creator_tokens (
    id            uuid primary key default uuid_generate_v4(),
    channel_id    text not null unique,
    email         text not null,
    access_token  text not null,                               -- SENSITIVE
    refresh_token text not null,                               -- SENSITIVE
    expires_at    timestamptz not null,
    created_at    timestamptz default now(),
    updated_at    timestamptz default now()
);
create index creator_tokens_channel_id_idx on creator_tokens (channel_id);
create index creator_tokens_email_idx      on creator_tokens (email);


-- =============================================================================
-- CATALOG
-- =============================================================================

-- [ACTIVE] The product catalog the live app uses (thin: title/desc/image/price
-- + embeddings). 49 rows in prod.
create table company_products (
    id              uuid primary key default uuid_generate_v4(),
    company_id      uuid not null,
    shop_domain     text not null,
    title           text not null,
    description     text,
    image           text,
    price           numeric,
    pinecone_id     text,
    search_keywords jsonb default '[]'::jsonb,  -- pre-generated YT search keywords
    synced_at       timestamptz default now(),
    updated_at      timestamptz default now()
);
create index idx_company_products_company_id      on company_products (company_id);
create index idx_company_products_shop            on company_products (shop_domain);
create index idx_company_products_search_keywords on company_products using gin (search_keywords);

-- [LEGACY] Rich Shopify product table (variants/images/vendor/handle). Wired in
-- backend/API.py but holds 0 rows — superseded by company_products.
create table shopify_products (
    id              uuid primary key default uuid_generate_v4(),
    shop_id         uuid references shopify_shops(id) on delete cascade,
    shopify_id      bigint not null unique,
    store_url       text not null,
    title           text not null,
    handle          text not null,
    body_html       text,
    vendor          text,
    product_type    text,
    tags            text[],
    variants        jsonb not null,
    images          jsonb not null,
    options         jsonb,
    published_at    timestamptz,
    last_matched_at timestamptz,
    match_count     integer default 0,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);
create index idx_shopify_products_shop_id      on shopify_products (shop_id);
create index idx_shopify_products_store_url    on shopify_products (store_url);
create index idx_shopify_products_vendor       on shopify_products (vendor);
create index idx_shopify_products_product_type on shopify_products (product_type);

-- [ACTIVE] Creator videos discovered/analysed by the pipeline. 23 rows.
create table creator_videos (
    id            uuid primary key default uuid_generate_v4(),
    video_id      text not null unique,                        -- YouTube video id
    url           text not null,
    title         text not null,
    description   text,
    thumbnail     text,
    channel_title text not null,
    channel_id    text not null,
    email         text,
    published_at  timestamptz,
    views         integer default 0,
    likes         integer default 0,
    analysis      jsonb,
    pinecone_id   text,
    indexed_at    timestamptz default now()
);
create index idx_creator_videos_video_id   on creator_videos (video_id);
create index idx_creator_videos_channel_id on creator_videos (channel_id);
create index idx_creator_videos_indexed_at on creator_videos (indexed_at desc);


-- =============================================================================
-- MATCHING & WORKFLOW
-- =============================================================================

-- [ACTIVE] The live matching table: product <-> creator video. 31 rows.
create table product_creator_matches (
    id                  uuid primary key default uuid_generate_v4(),
    product_id          uuid references company_products(id) on delete cascade,
    video_id            text references creator_videos(video_id) on delete cascade,
    source_keyword      text,
    similarity_score    numeric,
    relevance_score     numeric,
    relevance_reasoning text,
    created_at          timestamptz default now()
);
create index idx_matches_product on product_creator_matches (product_id);
create index idx_matches_video   on product_creator_matches (video_id);
create index idx_matches_score   on product_creator_matches (similarity_score desc);

-- [LEGACY] v1 matching table. No real .table()/.from() calls; 0 rows.
-- DROP candidate (see docs/schema-redesign.md, Phase 1).
create table matches (
    match_id   uuid primary key default gen_random_uuid(),
    company_id uuid default gen_random_uuid()
                 references companies(company_id) on update cascade on delete cascade,
    video_url  text,
    status     match_status,
    created_at timestamptz default now()
);
create index idx_company_video_url on matches (company_id, video_url);

-- [LEGACY] v2 matching table (Shorts-centric). Referenced in backend/API.py; 0 rows.
create table product_matches (
    id          uuid primary key default uuid_generate_v4(),
    product_id  uuid references shopify_products(id) on delete cascade,
    short_id    uuid references youtube_shorts(id)   on delete cascade,
    match_score double precision,
    matched_at  timestamptz default now(),
    unique (product_id, short_id)
);
create index idx_product_matches_product_id on product_matches (product_id);
create index idx_product_matches_short_id   on product_matches (short_id);

-- [ACTIVE] Per-merchant reel swipe history (dismissed / partnered). 15 rows.
-- The UNIQUE(company_id, video_id) backs the upsert in
-- frontend/src/app/api/reels/interactions (onConflict: company_id,video_id).
create table reel_interactions (
    id               uuid primary key default uuid_generate_v4(),
    company_id       uuid not null,
    video_id         text not null,                 -- references creator_videos.video_id
    interaction_type text not null,                 -- 'dismissed' | 'partnered'
    created_at       timestamptz default now(),
    unique (company_id, video_id)
);
create index idx_reel_interactions_company_id on reel_interactions (company_id);
create index idx_reel_interactions_video_id   on reel_interactions (video_id);
create index idx_reel_interactions_type       on reel_interactions (interaction_type);
create index idx_reel_interactions_created_at on reel_interactions (created_at desc);

-- [ACTIVE] CRM board: creator partnerships from discovery -> active. 14 rows.
-- Intentionally denormalized — creator_*/video_* are SNAPSHOT strings (no FKs to
-- creators/videos). The redesign keeps the snapshot but adds optional FKs.
create table partnerships (
    id                       uuid primary key default uuid_generate_v4(),
    company_id               uuid not null,
    -- creator snapshot (strings, not FKs)
    creator_name             text,
    creator_handle           text,
    creator_email            text,
    creator_avatar           text,
    creator_channel_url      text,
    -- video snapshot
    video_id                 text,
    video_title              text,
    video_url                text,
    video_thumbnail          text,
    -- workflow
    status                   text default 'to_contact',  -- to_contact|contacted|in_discussion|active|closed
    email_sent               boolean default false,
    email_draft              text,
    contract_drafted         boolean default false,
    contract_sent            boolean default false,
    contract_signed          boolean default false,
    contract_url             text,
    contract_data            jsonb,
    affiliate_link_generated boolean default false,
    affiliate_link           text,
    discount_code            text,
    commission_rate          numeric,
    payment_terms            text,
    notes                    text,
    matched_products         jsonb default '[]'::jsonb,
    -- analytics
    views                    integer default 0,
    likes                    integer default 0,
    comments                 integer default 0,
    clicks                   integer default 0,
    sales                    integer default 0,
    revenue                  numeric default 0.00,
    performance_data         jsonb default '{}'::jsonb,
    -- timestamps
    contacted_at             timestamptz,
    discussion_started_at    timestamptz,
    activated_at             timestamptz,
    closed_at                timestamptz,
    last_contact_date        timestamptz,
    created_at               timestamptz default now(),
    updated_at               timestamptz default now()
);
create index idx_partnerships_company_id    on partnerships (company_id);
create index idx_partnerships_status        on partnerships (status);
create index idx_partnerships_created_at    on partnerships (created_at desc);
create index idx_partnerships_creator_email on partnerships (creator_email) where creator_email is not null;

-- [ACTIVE] Public showcase page for a confirmed short. 1 row. Backs the public
-- /product/[slug] route. creator_id references auth.users, which the app does
-- NOT populate today (auth is mocked).
create table youtube_shorts (
    id              uuid primary key default uuid_generate_v4(),
    youtube_id      text not null unique,
    creator_id      uuid references auth.users(id),
    slug            text unique default random_slug_6(),
    title           text not null,
    status          text default 'pending'
                      check (status in ('pending', 'confirmed', 'rejected')),
    products        jsonb,
    showcase_images text[],
    main_image_url  text,
    reviews         bigint,
    email           text,
    confirmed_at    timestamp,
    created_at      timestamptz default now()
);

-- [DEAD] Public partnership page. Zero references in any file; 0 rows.
-- DROP candidate (see docs/schema-redesign.md, Phase 1).
create table product_pages (
    product_page_id uuid primary key default gen_random_uuid(),
    partnership_id  uuid unique default gen_random_uuid(),
    page_slug       text not null unique,
    title           text,
    products        jsonb,
    main_image_url  text,
    created_at      timestamptz
);


-- =============================================================================
-- SUPPORT
-- =============================================================================

-- [ACTIVE] Landing-page waitlist signups (INSERT-only from the browser).
create table waitlist (
    id         uuid primary key default gen_random_uuid(),
    email      text not null unique,
    name       text,
    created_at timestamptz default now()
);
create index idx_waitlist_email      on waitlist (email);
create index idx_waitlist_created_at on waitlist (created_at desc);


-- =============================================================================
-- WORKER / STAGING  (ideally lives in a separate `worker` schema, not `public`)
-- =============================================================================

-- [WORKER] Append-only URL dedup log for the discovery worker. 31 rows.
-- Written but never read back by application code.
create table yt_shorts_all (
    id         uuid primary key,
    url        text,
    created_at timestamptz default now()
);

-- [WORKER] Staging row for a short pending processing. 0 rows. Note the
-- hardcoded personal-email default on `email` — pipeline cruft.
create table yt_shorts_pending (
    id           uuid primary key default gen_random_uuid(),
    company      text default ''::text,
    channel_id   text,
    short_id     text,
    yt_short_url text,
    product_text text[],
    product_imgs text[],
    cached_query text,
    email        text not null default '"aayankarmali@gmail.com"'::text,
    created_at   timestamptz default now()
);


-- =============================================================================
-- FUNCTIONS  (search_path pinned — see enable_rls_security.sql)
-- =============================================================================

create or replace function cleanup_expired_oauth_states()
returns void
language plpgsql
set search_path = public
as $$
begin
    delete from shopify_oauth_states where expires_at < now();
end;
$$;

create or replace function random_slug_6()
returns text
language sql
set search_path = public
as $$
  select string_agg(
    substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
           floor(random() * 62 + 1)::int, 1), '')
  from generate_series(1, 6);
$$;

create or replace function update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

create or replace function update_partnerships_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- =============================================================================
-- ROW LEVEL SECURITY
-- See backend/data/enable_rls_security.sql for the authoritative, commented
-- definition (enable RLS on every table + minimal anon policies). Summary:
--   anon SELECT  : creator_videos, product_creator_matches, youtube_shorts,
--                  yt_shorts_pending, reel_interactions
--   anon DELETE  : reel_interactions
--   anon INSERT  : waitlist
--   everything else => server-only (service-role bypasses RLS)
-- =============================================================================
