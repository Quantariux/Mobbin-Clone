# Loupe

An open-source, free-forever design-reference app: browse invented product
screens, filter them by category, screen type, UI element or flow, and save
favorites into your own collections. Built as a practice project inspired by
design-pattern reference sites — **all apps, screens, icons and brands in the
library are invented**; nothing is scraped from real products.

## Stack

- **Frontend** — React 19 + Vite, Tailwind CSS 4, lucide-react, Radix
  primitives (shadcn-style), TanStack Query
- **Backend** — Supabase: Postgres with row-level security, Storage for
  screen images, email/password Auth
- **Data** — a seed script generates every screen image as an SVG mockup and
  uploads it to Supabase Storage

## Setup

1. Create a [Supabase](https://supabase.com) project.
2. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL` — Project Settings → API
   - `VITE_SUPABASE_ANON_KEY` — the anon/publishable key
   - `SUPABASE_SERVICE_ROLE_KEY` — the service_role secret (seed script only,
     never shipped to the browser)
3. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
4. Seed the database and storage bucket:

   ```sh
   npm install
   node supabase/seed.mjs
   ```

5. Start the dev server:

   ```sh
   npm run dev
   ```

## Capture pipeline (real screenshots)

`capture/crawl.mjs` is a Playwright-based web crawler — the same shape of
pipeline design-reference sites use: headless Chromium at 1440×900, scripted
navigation steps (including logging in), one PNG per step, uploaded to
Supabase Storage and inserted as tagged `screens` rows that appear in the
app immediately.

```sh
npm install
npx playwright install chromium
node capture/crawl.mjs
```

Targets are declared in the `TARGETS` array — an app record plus ordered
navigation steps sharing one browser session. **Only add targets you have
the right to capture and publish** (your own products, staging sites,
licensed sources). The default target is the Loupe app itself: the clone
crawls itself and ingests its own screenshots.

## Project layout

| Path | Purpose |
| --- | --- |
| `supabase/schema.sql` | Tables, indexes and RLS policies |
| `supabase/seed.mjs` | Generates SVG mockups, uploads them, seeds all tables |
| `capture/crawl.mjs` | Playwright crawler: capture → upload → tag pipeline |
| `src/lib/supabase.ts` | Supabase client (guards against missing env vars) |
| `src/lib/queries.ts` | All data access — join-table `!inner` filter queries |
| `src/lib/auth.jsx` | Auth provider + modal (email/password) |
| `src/views/` | Browse, app detail and landing views |

## License

[MIT](LICENSE) — free forever, use it however you like.
