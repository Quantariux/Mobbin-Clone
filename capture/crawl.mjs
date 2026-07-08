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
 * CONTENT POLICY — real-site captures follow website-gallery norms:
 * public marketing pages only, credited by name and domain, no login-walled
 * pages, no scraped logo assets (icons are original monograms), and any
 * featured company's removal request should be honored immediately. Only
 * add targets you're comfortable publishing under those terms.
 *
 * Reads from .env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and
 * optionally CAPTURE_LOGIN_EMAIL / CAPTURE_LOGIN_PASSWORD for targets whose
 * steps need an authenticated session (used by the Loupe self-capture).
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
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";

/* ---------- category taxonomy the real targets need ---------- */

const ENSURE_CATEGORIES = [
  { name: "Developer Tools", slug: "developer-tools" },
  { name: "Design", slug: "design" },
  { name: "Entertainment", slug: "entertainment" },
];

/* ---------- original monogram icons (no scraped logo assets) ---------- */

const monogramIcon = (letter, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
    <rect width="96" height="96" rx="21" fill="${bg}"/>
    <text x="48" y="66" text-anchor="middle" font-family="Arial, sans-serif" font-size="50" font-weight="bold" fill="#ffffff">${letter}</text></svg>`;

/* ---------- target helpers ---------- */

/** Public marketing homepage: one credited capture, no interaction. */
const site = ({ name, slug, tagline, url, categories, color, highlight = false }) => ({
  app: {
    name,
    slug,
    tagline,
    platform: ["web"],
    rating: null,
    review_count: 0,
    website_url: url,
    categories,
  },
  iconSvg: monogramIcon(name[0].toUpperCase(), color),
  steps: [
    {
      name: "home",
      type: "welcome-get-started",
      highlight,
      run: async (page) => {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
        await page.waitForTimeout(4000); // fonts, hero media, lazy sections
      },
    },
  ],
});

/* ---------- targets ---------- */

const TARGETS = [
  // Self-capture: the clone crawling itself (login flow exercises the UI).
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
          await page.waitForTimeout(800);
        },
      },
      {
        name: "browse",
        type: "filter-sort",
        run: async (page) => {
          if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
            throw new Error("browse step needs CAPTURE_LOGIN_EMAIL / CAPTURE_LOGIN_PASSWORD");
          }
          await page.getByRole("button", { name: "Log in" }).click();
          await page.fill('input[type="email"]', LOGIN_EMAIL);
          await page.fill('input[type="password"]', LOGIN_PASSWORD);
          await page.click('button[type="submit"]');
          await page.waitForSelector('button[aria-label^="Open "]', { timeout: 20000 });
          await page.waitForTimeout(1200);
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

  // Real products — public homepages, credited, monogram icons.
  site({ name: "Linear", slug: "linear", tagline: "Issue tracking and product planning", url: "https://linear.app", categories: ["productivity", "developer-tools"], color: "#5e6ad2", highlight: true }),
  site({ name: "Vercel", slug: "vercel", tagline: "Frontend cloud and deployments", url: "https://vercel.com", categories: ["developer-tools"], color: "#111111" }),
  site({ name: "Stripe", slug: "stripe", tagline: "Online payments for businesses", url: "https://stripe.com", categories: ["finance", "developer-tools"], color: "#635bff", highlight: true }),
  site({ name: "Notion", slug: "notion", tagline: "Docs, wikis and projects in one workspace", url: "https://www.notion.com", categories: ["productivity"], color: "#111111" }),
  site({ name: "Figma", slug: "figma", tagline: "Collaborative interface design", url: "https://www.figma.com", categories: ["design"], color: "#a259ff" }),
  site({ name: "Arc", slug: "arc", tagline: "A different kind of web browser", url: "https://arc.net", categories: ["productivity"], color: "#fa6b60" }),
  site({ name: "Raycast", slug: "raycast", tagline: "Launcher and productivity toolkit for Mac", url: "https://www.raycast.com", categories: ["productivity", "developer-tools"], color: "#ff6363" }),
  site({ name: "GitHub", slug: "github", tagline: "Code hosting and collaboration", url: "https://github.com", categories: ["developer-tools"], color: "#24292f" }),
  site({ name: "Supabase", slug: "supabase", tagline: "Open-source Postgres backend platform", url: "https://supabase.com", categories: ["developer-tools"], color: "#3ecf8e" }),
  site({ name: "Framer", slug: "framer", tagline: "Design and publish websites", url: "https://www.framer.com", categories: ["design"], color: "#0055ff" }),
  site({ name: "OpenAI", slug: "openai", tagline: "AI research and the ChatGPT assistant", url: "https://openai.com", categories: ["productivity"], color: "#10a37f" }),
  site({ name: "Robinhood", slug: "robinhood", tagline: "Retail investing and trading", url: "https://robinhood.com", categories: ["finance"], color: "#00c805" }),
  site({ name: "Airbnb", slug: "airbnb", tagline: "Vacation rentals and experiences", url: "https://www.airbnb.com", categories: ["travel-transportation"], color: "#ff385c" }),
  site({ name: "Spotify", slug: "spotify", tagline: "Music and podcast streaming", url: "https://open.spotify.com", categories: ["entertainment"], color: "#1db954" }),
  site({ name: "Uber", slug: "uber", tagline: "Rides and delivery on demand", url: "https://www.uber.com", categories: ["travel-transportation"], color: "#111111" }),
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

  await db.from("categories").upsert(ENSURE_CATEGORIES, { onConflict: "slug" });

  const { data: screenTypes, error: stErr } = await db.from("screen_types").select("id, slug");
  if (stErr) throw new Error(stErr.message);
  const typeBySlug = Object.fromEntries(screenTypes.map((t) => [t.slug, t.id]));

  const { data: categories, error: catErr } = await db.from("categories").select("id, slug");
  if (catErr) throw new Error(catErr.message);
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  const browser = await chromium.launch();
  let ok = 0;
  let failed = 0;

  for (const target of TARGETS) {
    const { app, steps, iconSvg } = target;
    process.stdout.write(`▶ ${app.name} … `);

    let appRow = null;
    let captured = 0;
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 2,
      userAgent: USER_AGENT,
    });
    const page = await context.newPage();

    try {
      const iconUrl = iconSvg
        ? await upload(`icons/${app.slug}.svg`, Buffer.from(iconSvg), "image/svg+xml")
        : null;

      const { data, error: appErr } = await db
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
      appRow = data;

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

      for (const step of steps) {
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
        captured++;
      }
      console.log(`${captured} screen${captured === 1 ? "" : "s"} ✓`);
      ok++;
    } catch (err) {
      console.log(`✗ skipped — ${err.message.split("\n")[0]}`);
      failed++;
      // don't leave empty app entries behind
      if (appRow && captured === 0) await db.from("apps").delete().eq("id", appRow.id);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log(`\nDone: ${ok} targets captured, ${failed} skipped.`);
}

main().catch((err) => {
  console.error("Capture failed:", err.message);
  process.exit(1);
});
