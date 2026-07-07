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

## Project layout

| Path | Purpose |
| --- | --- |
| `supabase/schema.sql` | Tables, indexes and RLS policies |
| `supabase/seed.mjs` | Generates SVG mockups, uploads them, seeds all tables |
| `src/lib/supabase.ts` | Supabase client (guards against missing env vars) |
| `src/lib/queries.ts` | All data access — join-table `!inner` filter queries |
| `src/lib/auth.jsx` | Auth provider + modal (email/password) |
| `src/views/` | Browse, app detail and landing views |

## License

[MIT](LICENSE) — free forever, use it however you like.
