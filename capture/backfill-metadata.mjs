/**
 * Backfill screen metadata (title / description / page_url) from
 * capture/metadata.json — for the case where screens were captured before
 * supabase/migrations/003_screen_metadata.sql was applied. No recapture.
 *
 * Usage:  node capture/backfill-metadata.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

function loadEnv() {
  const env = { ...process.env };
  if (existsSync(".env")) {
    for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const env = loadEnv();
const db = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

if (!existsSync("capture/metadata.json")) {
  console.error("capture/metadata.json not found — run capture/crawl.mjs first.");
  process.exit(1);
}

const store = JSON.parse(readFileSync("capture/metadata.json", "utf8"));
let updated = 0;
let failed = 0;

for (const [imageUrl, meta] of Object.entries(store)) {
  const { error, count } = await db
    .from("screens")
    .update(
      { title: meta.title, description: meta.description, page_url: meta.page_url },
      { count: "exact" },
    )
    .eq("image_url", imageUrl);
  if (error) {
    failed++;
    if (/column|schema cache/i.test(error.message)) {
      console.error("Metadata columns missing — run supabase/migrations/003_screen_metadata.sql first.");
      process.exit(1);
    }
  } else if (count > 0) {
    updated += count;
  }
}

console.log(`Backfilled ${updated} screens (${failed} errors).`);
