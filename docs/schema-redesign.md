# Database schema redesign

Status: **proposal** — nothing here has been executed. The live schema is captured
as-is in [`backend/data/schema.sql`](../backend/data/schema.sql). This document
evaluates how the database is used today and proposes a cleaner target, plus a
phased, low-risk migration path.

Row counts below are from the live DB (2026-05-31); usage is from grepping
`.from("…")` / `.table("…")` across `frontend/src` and `backend`.

---

## 1. What's wrong today

### 1a. Three generations of the same matching pipeline

The same "match a product to a piece of creator content" concept exists three
times. Only the third is alive.

| Gen | Product table | Match table | Content table | Rows (P / M / C) | Status |
|-----|---------------|-------------|---------------|------------------|--------|
| v1  | —             | `matches`   | (video_url string) | – / 0 / – | dead |
| v2  | `shopify_products` | `product_matches` | `youtube_shorts` | 0 / 0 / 1 | legacy |
| **v3 (live)** | **`company_products`** | **`product_creator_matches`** | **`creator_videos`** | **49 / 31 / 23** | **active** |

The demo runs entirely on v3. v1/v2 are still referenced in `backend/API.py` but
hold ~0 rows.

### 1b. A merchant is spread across three tables

`companies`, `shopify_shops`, and `shopify_oauth_tokens` all describe one
merchant. The Shopify **access token is stored twice** (`companies.access_token`
*and* `shopify_oauth_tokens.access_token`). `shop_domain` is the real natural key
everywhere, but `company_id` (sometimes a FK, sometimes a bare UUID) is used to
join.

### 1c. A creator is not an entity

Creator data is smeared across four tables as loose columns:

- `creator_videos` → `channel_id`, `channel_title`, `email`
- `creator_tokens` → `channel_id` + OAuth secrets
- `partnerships` → `creator_name`, `creator_handle`, `creator_email`,
  `creator_avatar` as **plain strings**
- `youtube_shorts.creator_id` → FK to `auth.users`, which the app never
  populates (auth is mocked — see the auth-is-mocked note)

There is no single `creators` row to join to.

### 1d. Two product tables

`shopify_products` (rich: variants/images/vendor/handle, **0 rows**) vs
`company_products` (thin: title/desc/image/price + embeddings, **49 rows,
live**). The thin one won.

### 1e. Two dead "public page" concepts

`product_pages` (**0 rows, 0 references anywhere**) and `youtube_shorts` (backs
the public `/product/[slug]` page, 1 row) both model "a public page for a
partnership/short."

### 1f. Worker scratch tables in the core schema

`yt_shorts_all` (append-only URL dedup log, 31 rows, never read back) and
`yt_shorts_pending` (staging, 0 rows, has a hardcoded personal-email default)
are pipeline internals sitting in `public`, so they're exposed via the API.

---

## 2. Proposed target (18 → 11 tables)

Organized around real domain entities: **Merchant → Product**, **Creator →
Video**, and the **Match / Partnership** that connect them.

```
IDENTITY
  merchants        (was companies + shopify_shops + shopify_oauth_tokens)
    id pk · shop_domain UNIQUE (natural key)
    shop_name, email, plan, country, currency, timezone,
    ingested, products_synced, product_count, keywords[]
  merchant_oauth   (secrets split out so RLS can expose a profile w/o tokens)
    merchant_id fk→merchants · access_token, scope, expires_at, is_active
  creators         (NEW — consolidates creator identity)
    id pk · channel_id UNIQUE · channel_title, email, avatar, channel_url
  creator_oauth    (was creator_tokens)
    creator_id fk→creators · access_token, refresh_token, expires_at

CATALOG
  products         (was company_products; absorb useful shopify_products cols)
    id pk · merchant_id fk · shopify_product_id
    title, description, image, price, handle, vendor, tags[],
    pinecone_id, search_keywords jsonb
  videos           (was creator_videos)
    id pk · creator_id fk→creators · youtube_id UNIQUE
    url, title, thumbnail, published_at, views, likes, analysis jsonb, pinecone_id

MATCHING & WORKFLOW
  matches          (was product_creator_matches; reuse the clean name once v1 dropped)
    id pk · product_id fk→products · video_id fk→videos
    similarity_score, relevance_score, reasoning · UNIQUE(product_id, video_id)
  interactions     (was reel_interactions)
    id pk · merchant_id fk · video_id fk · type · UNIQUE(merchant_id, video_id)
  partnerships     (kept; add FKs, keep snapshot cols — see note)
    id pk · merchant_id fk · creator_id fk · video_id fk
    status, *_at, contract_*, affiliate_*, matched_products jsonb, analytics cols
  showcase_pages   (merges youtube_shorts' public-page role + product_pages)
    id pk · slug UNIQUE · partnership_id fk · title, products jsonb, main_image_url, status

SUPPORT
  waitlist · shopify_oauth_states (transient CSRF)

WORKER (move to a `worker` schema, OUT of public/the API surface)
  ingest_log (was yt_shorts_all) · ingest_staging (was yt_shorts_pending)
```

**Dropped from `public` (7):** `matches`(v1), `product_matches`,
`shopify_products`, `youtube_shorts`, `product_pages`, `yt_shorts_all`,
`yt_shorts_pending` (last two move to a `worker` schema).

### Why this is better
- **One merchant, one creator** → joins instead of string matching; partnerships
  reference `creators`/`videos` by FK.
- **OAuth secrets isolated** in `*_oauth` tables → RLS can expose a public
  profile while keeping tokens server-only (complements the RLS work already
  applied — see [`enable_rls_security.sql`](../backend/data/enable_rls_security.sql)).
- **`interactions` keeps its real `UNIQUE(merchant_id, video_id)`** — the reels
  upsert (`onConflict: company_id,video_id`) depends on it.
- **Staging out of `public`** → worker scratch tables stop being API-reachable.

---

## 3. Two honest caveats

1. **`partnerships` denormalization is partly intentional.** It's a CRM board;
   snapshotting the creator's name/avatar at partnership time is legitimate (the
   channel can change later). Add `creator_id`/`video_id` FKs for joins but
   **keep** the snapshot columns. The ~1,700-line partnerships page reads those
   strings directly, so fully normalizing it is a separate FE effort.

2. **This is a migration, not a rename.** `backend/API.py` still calls v2 tables.
   The backend isn't deployed and auth is mocked, so risk is low — but it's real
   code surgery, best done in phases.

---

## 4. Phased migration plan

### Phase 1 — Remove confirmed-dead tables (safe, isolated)
- `DROP TABLE public.product_pages;`  (0 rows, 0 references)
- `DROP TABLE public.matches;`        (0 rows, only a coincidental dict key)
- No application code changes required. Apply via a dedicated migration after review.

### Phase 2 — Retire the v2 pipeline
- Confirm `shopify_products` / `product_matches` / `youtube_shorts` are truly
  unused at runtime (they're wired in `backend/API.py` but empty).
- Either delete those endpoints or repoint them at the v3 tables.
- Then drop the v2 tables. Requires backend edits + redeploy.

### Phase 3 — Consolidate identity
- Introduce `creators` and `merchants`; backfill from existing rows
  (`creator_videos`/`creator_tokens` → `creators`; `companies`+`shopify_shops`+
  `shopify_oauth_tokens` → `merchants`/`merchant_oauth`).
- Add FKs on `partnerships`, `interactions`, `products`, `videos`.
- Migrate reads/writes in frontend + backend; drop the old identity tables.

### Phase 4 — Move worker tables out of `public`
- Create a `worker` schema; move `yt_shorts_all` → `worker.ingest_log` and
  `yt_shorts_pending` → `worker.ingest_staging` (removes them from the API).

Each phase is independently shippable and reversible up to the `DROP`.

---

## 5. Recommended immediate step

Phase 1 only: a `DROP TABLE product_pages, matches;` migration, reviewed and
applied on its own. Everything else waits until the backend is being actively
worked on, so schema churn lands alongside the code that depends on it.
