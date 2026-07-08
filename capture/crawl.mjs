/**
 * Web capture pipeline — Playwright edition of the "automated crawler" stage.
 *
 * Usage:  node capture/crawl.mjs
 *
 * For each target: launches headless Chromium at 1440x900 (the app's 1.6:1
 * web-screen format), runs the target's scripted navigation steps like a
 * user would (goto, log in, click through), captures a PNG per step,
 * uploads it to the Supabase "screens" bucket, and upserts the app +
 * screens + screen_type tag rows. Re-running replaces a target's screens.
 *
 * IMPORTANT — only add targets you have the right to capture and publish:
 * your own products, staging sites, or explicitly licensed sources. This
 * repo's brief excludes third-party brand assets, so the default target is
 * the Loupe app itself (the clone crawls itself — fully self-hosted pixels).
 *
 * Reads from .env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and
 * optionally CAPTURE_LOGIN_EMAIL / CAPTURE_LOGIN_PASSWORD for targets whose
 * steps need an authenticated session. CAPTURE_BASE_URL overrides the
 * default target's base URL (default http://localhost:5173).
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

/* ---------- env ---------- */

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
const URL_ = env.VITE_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = env.CAPTURE_BASE_URL || "http://localhost:5173";
const LOGIN_EMAIL = env.CAPTURE_LOGIN_EMAIL;
const LOGIN_PASSWORD = env.CAPTURE_LOGIN_PASSWORD;

if (!URL_ || !SERVICE_KEY) {
  console.error(
    "Missing credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env, then re-run.",
  );
  process.exit(1);
}

const db = createClient(URL_, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* ---------- viewport = the app's web-screen format ---------- */

const VIEWPORT = { width: 1440, height: 900 }; // 1.6:1

/* ---------- targets ----------
 * Each target: an app record plus ordered navigation steps. Steps share one
 * page/session, so a login step carries into the steps after it. Each step
 * captures one screen tagged with a screen_type slug.
 */

const TARGETS = [
  {
    app: {
      name: "Loupe",
      slug: "loupe",
      tagline: "This very app, captured by its own crawler",
      platform: ["web"],
      rating: 5.0,
      review_count: 1,
      website_url: "https://github.com/Quantariux/Mobbin-Clone",
      categories: ["productivity"],
    },
    // Original brand mark, same glyph as src/components/brand.jsx
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
      <rect width="96" height="96" rx="21" fill="#111111"/>
      <circle cx="42" cy="42" r="18" stroke="#ffffff" stroke-width="10" fill="none"/>
      <path d="M56 56 L72 72" stroke="#ffffff" stroke-width="11" stroke-linecap="round"/></svg>`,
    steps: [
      {
        name: "landing",
        type: "welcome-get-started",
        highlight: true,
        run: async (page) => {
          await page.goto(BASE, { waitUntil: "load" });
          await page.waitForSelector("text=open source and free forever", { timeout: 15000 });
          await page.waitForTimeout(800); // let stats + fonts settle
        },
      },
      {
        name: "browse",
        type: "filter-sort",
        run: async (page) => {
          if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
            throw new Error(
              "browse step needs CAPTURE_LOGIN_EMAIL / CAPTURE_LOGIN_PASSWORD in .env",
            );
          }
          await page.getByRole("button", { name: "Log in" }).click();
          await page.fill('input[type="email"]', LOGIN_EMAIL);
          await page.fill('input[type="password"]', LOGIN_PASSWORD);
          await page.click('button[type="submit"]');
          await page.waitForSelector('button[aria-label^="Open "]', { timeout: 20000 });
          await page.waitForTimeout(1200); // screenshots lazy-load
        },
      },
      {
        name: "app-detail",
        type: "dashboard",
        run: async (page) => {
          await page.locator('button[aria-label^="Open "]').first().click();
          await page.waitForSelector("text=screens", { timeout: 15000 });
          await page.waitForTimeout(1200);
        },
      },
    ],
  },
];

/* ---------- helpers ---------- */

async function upload(path, body, contentType) {
  const { error } = await db.storage
    .from("screens")
    .upload(path, body, { contentType, upsert: true });
  if (error) throw new Error(`upload ${path}: ${error.message}`);
  return db.storage.from("screens").getPublicUrl(path).data.publicUrl;
}

/* ---------- main ---------- */

async function main() {
  console.log(`Capturing with Playwright → ${URL_}`);

  const { data: screenTypes, error: stErr } = await db.from("screen_types").select("id, slug");
  if (stErr) throw new Error(stErr.message);
  const typeBySlug = Object.fromEntries(screenTypes.map((t) => [t.slug, t.id]));

  const { data: categories, error: catErr } = await db.from("categories").select("id, slug");
  if (catErr) throw new Error(catErr.message);
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  const browser = await chromium.launch();

  for (const target of TARGETS) {
    const { app, steps, iconSvg } = target;
    console.log(`\n▶ ${app.name} (${steps.length} steps)`);

    const iconUrl = iconSvg
      ? await upload(`icons/${app.slug}.svg`, Buffer.from(iconSvg), "image/svg+xml")
      : null;

    const { data: appRow, error: appErr } = await db
      .from("apps")
      .upsert(
        {
          name: app.name,
          slug: app.slug,
          tagline: app.tagline,
          icon_url: iconUrl,
          platform: app.platform,
          rating: app.rating,
          review_count: app.review_count,
          website_url: app.website_url,
        },
        { onConflict: "slug" },
      )
      .select()
      .single();
    if (appErr) throw new Error(`apps: ${appErr.message}`);

    for (const slug of app.categories ?? []) {
      if (!catBySlug[slug]) continue;
      await db
        .from("app_categories")
        .upsert(
          { app_id: appRow.id, category_id: catBySlug[slug] },
          { onConflict: "app_id,category_id" },
        );
    }

    // replace previous captures for this app
    await db.from("screens").delete().eq("app_id", appRow.id);

    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
    const page = await context.newPage();

    for (const step of steps) {
      process.stdout.write(`  · ${step.name} … `);
      await step.run(page);
      const png = await page.screenshot({ type: "png" });
      const url = await upload(`${app.slug}/web-${step.name}.png`, png, "image/png");

      const { data: screen, error: scrErr } = await db
        .from("screens")
        .insert({
          app_id: appRow.id,
          image_url: url,
          platform: "web",
          is_highlight: Boolean(step.highlight),
        })
        .select()
        .single();
      if (scrErr) throw new Error(`screens: ${scrErr.message}`);

      if (typeBySlug[step.type]) {
        await db
          .from("screen_screen_types")
          .insert({ screen_id: screen.id, screen_type_id: typeBySlug[step.type] });
      }
      console.log("captured ✓");
    }

    await context.close();
  }

  await browser.close();
  console.log("\nDone — captures are live in the app.");
}

main().catch((err) => {
  console.error("Capture failed:", err.message);
  process.exit(1);
});
