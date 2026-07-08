/**
 * Web capture pipeline — multi-page Playwright crawler.
 *
 * Usage:  node capture/crawl.mjs
 *
 * Per target: crawls up to MAX_SCREENS public pages (curated common paths +
 * links discovered on the homepage), captures each at 1440x900, extracts the
 * page's own <title> and meta description, uploads PNGs to Supabase Storage
 * and inserts screens rows. Metadata is also written to capture/metadata.json
 * so it can be backfilled (capture/backfill-metadata.mjs) if the DB columns
 * from supabase/migrations/003_screen_metadata.sql weren't applied yet.
 *
 * CONTENT POLICY — website-gallery norms: public marketing pages only,
 * credited by name and domain, no login-walled third-party pages, no scraped
 * logo assets (icons are original monograms). Honor removal requests.
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

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
  console.error("Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const db = createClient(URL_, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const VIEWPORT = { width: 1440, height: 900 };
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
const MAX_SCREENS = 16; // aim for >= 15 per site
const CONCURRENCY = 3;

const ENSURE_CATEGORIES = [
  { name: "Developer Tools", slug: "developer-tools" },
  { name: "Design", slug: "design" },
  { name: "Entertainment", slug: "entertainment" },
];

/* Paths most SaaS/product sites expose publicly; 404s are skipped and
 * homepage link discovery fills the gap up to MAX_SCREENS. */
const COMMON_PATHS = [
  "", "pricing", "features", "product", "customers", "about", "blog",
  "careers", "contact", "enterprise", "security", "templates", "changelog",
  "download", "signup", "login",
];

const SKIP_LINK = /(privacy|terms|legal|cookie|status|policy|sitemap|\.pdf|\.zip|mailto:|tel:)/i;

const monogramIcon = (letter, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
    <rect width="96" height="96" rx="21" fill="${bg}"/>
    <text x="48" y="66" text-anchor="middle" font-family="Arial, sans-serif" font-size="50" font-weight="bold" fill="#ffffff">${letter}</text></svg>`;

const site = ({ name, slug, tagline, url, categories, color, highlight = false, paths }) => ({
  app: {
    name, slug, tagline,
    platform: ["web"],
    rating: null,
    review_count: 0,
    website_url: url,
    categories,
  },
  iconSvg: monogramIcon(name[0].toUpperCase(), color),
  highlight,
  paths: paths ?? COMMON_PATHS,
});

/* ---------- targets ---------- */

const TARGETS = [
  // Self-capture: scripted steps (login flow), not path crawling.
  {
    app: {
      name: "Loupe", slug: "loupe",
      tagline: "This very app, captured by its own crawler",
      platform: ["web"], rating: 5.0, review_count: 1,
      website_url: "https://github.com/Quantariux/Mobbin-Clone",
      categories: ["productivity"],
    },
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
      <rect width="96" height="96" rx="21" fill="#111111"/>
      <circle cx="42" cy="42" r="18" stroke="#ffffff" stroke-width="10" fill="none"/>
      <path d="M56 56 L72 72" stroke="#ffffff" stroke-width="11" stroke-linecap="round"/></svg>`,
    steps: [
      {
        name: "landing", type: "welcome-get-started", highlight: true,
        run: async (page) => {
          await page.goto(BASE, { waitUntil: "load" });
          await page.waitForSelector("text=open source and free forever", { timeout: 15000 });
          await page.waitForTimeout(800);
        },
      },
      {
        name: "browse", type: "filter-sort",
        run: async (page) => {
          if (!LOGIN_EMAIL || !LOGIN_PASSWORD) throw new Error("needs CAPTURE_LOGIN_* env");
          await page.getByRole("button", { name: "Log in" }).click();
          await page.fill('input[type="email"]', LOGIN_EMAIL);
          await page.fill('input[type="password"]', LOGIN_PASSWORD);
          await page.click('button[type="submit"]');
          await page.waitForSelector('button[aria-label^="Open "]', { timeout: 20000 });
          await page.waitForTimeout(1200);
        },
      },
      {
        name: "app-detail", type: "dashboard",
        run: async (page) => {
          await page.locator('button[aria-label^="Open "]').first().click();
          await page.waitForSelector("text=screens", { timeout: 15000 });
          await page.waitForTimeout(1200);
        },
      },
    ],
  },

  site({ name: "Linear", slug: "linear", tagline: "Issue tracking and product planning", url: "https://linear.app", categories: ["productivity", "developer-tools"], color: "#5e6ad2", highlight: true }),
  site({ name: "Vercel", slug: "vercel", tagline: "Frontend cloud and deployments", url: "https://vercel.com", categories: ["developer-tools"], color: "#111111" }),
  site({ name: "Stripe", slug: "stripe", tagline: "Online payments for businesses", url: "https://stripe.com", categories: ["finance", "developer-tools"], color: "#635bff", highlight: true }),
  site({ name: "Notion", slug: "notion", tagline: "Docs, wikis and projects in one workspace", url: "https://www.notion.com", categories: ["productivity"], color: "#111111" }),
  site({ name: "Figma", slug: "figma", tagline: "Collaborative interface design", url: "https://www.figma.com", categories: ["design"], color: "#a259ff" }),
  site({ name: "Arc", slug: "arc", tagline: "A different kind of web browser", url: "https://arc.net", categories: ["productivity"], color: "#fa6b60" }),
  site({ name: "Raycast", slug: "raycast", tagline: "Launcher and productivity toolkit for Mac", url: "https://www.raycast.com", categories: ["productivity", "developer-tools"], color: "#ff6363" }),
  site({ name: "GitHub", slug: "github", tagline: "Code hosting and collaboration", url: "https://github.com", categories: ["developer-tools"], color: "#24292f", paths: ["", "features", "pricing", "enterprise", "features/copilot", "security", "about", "customer-stories", "mobile", "team", "trending", "marketplace", "topics", "readme", "signup", "login"] }),
  site({ name: "Supabase", slug: "supabase", tagline: "Open-source Postgres backend platform", url: "https://supabase.com", categories: ["developer-tools"], color: "#3ecf8e" }),
  site({ name: "Framer", slug: "framer", tagline: "Design and publish websites", url: "https://www.framer.com", categories: ["design"], color: "#0055ff" }),
  site({ name: "OpenAI", slug: "openai", tagline: "AI research and the ChatGPT assistant", url: "https://openai.com", categories: ["productivity"], color: "#10a37f" }),
  site({ name: "Robinhood", slug: "robinhood", tagline: "Retail investing and trading", url: "https://robinhood.com", categories: ["finance"], color: "#00c805" }),
  site({ name: "Airbnb", slug: "airbnb", tagline: "Vacation rentals and experiences", url: "https://www.airbnb.com", categories: ["travel-transportation"], color: "#ff385c" }),
  site({ name: "Spotify", slug: "spotify", tagline: "Music and podcast streaming", url: "https://open.spotify.com", categories: ["entertainment"], color: "#1db954" }),
  site({ name: "Uber", slug: "uber", tagline: "Rides and delivery on demand", url: "https://www.uber.com", categories: ["travel-transportation"], color: "#111111", paths: ["", "us/en/ride", "us/en/drive", "us/en/deliver", "us/en/business", "us/en/about", "us/en/safety", "us/en/careers", "us/en/airports", "us/en/cities", "blog", "us/en/freight", "us/en/gift-cards", "us/en/u/quiet-preferred", "login", "signup"] }),
];

/* ---------- helpers ---------- */

const metadataStore = existsSync("capture/metadata.json")
  ? JSON.parse(readFileSync("capture/metadata.json", "utf8"))
  : {};

async function upload(path, body, contentType) {
  const { error } = await db.storage
    .from("screens")
    .upload(path, body, { contentType, upsert: true });
  if (error) throw new Error(`upload ${path}: ${error.message}`);
  return db.storage.from("screens").getPublicUrl(path).data.publicUrl;
}

/** Insert a screen row; falls back to base columns when the metadata
 *  migration (003) hasn't been applied yet. */
async function insertScreen(base, meta) {
  let res = await db.from("screens").insert({ ...base, ...meta }).select().single();
  if (res.error && /column|schema cache/i.test(res.error.message)) {
    res = await db.from("screens").insert(base).select().single();
  }
  if (res.error) throw new Error(`screens: ${res.error.message}`);
  return res.data;
}

function typeForPath(pathname, isHome) {
  if (isHome) return "welcome-get-started";
  if (/signup|register|join/i.test(pathname)) return "signup";
  if (/login|signin/i.test(pathname)) return "signup";
  return null;
}

async function upsertApp(app, iconSvg, catBySlug) {
  const iconUrl = iconSvg
    ? await upload(`icons/${app.slug}.svg`, Buffer.from(iconSvg), "image/svg+xml")
    : null;
  const { data, error } = await db
    .from("apps")
    .upsert(
      {
        name: app.name, slug: app.slug, tagline: app.tagline, icon_url: iconUrl,
        platform: app.platform, rating: app.rating, review_count: app.review_count,
        website_url: app.website_url,
      },
      { onConflict: "slug" },
    )
    .select()
    .single();
  if (error) throw new Error(`apps: ${error.message}`);
  for (const slug of app.categories ?? []) {
    if (!catBySlug[slug]) continue;
    await db.from("app_categories").upsert(
      { app_id: data.id, category_id: catBySlug[slug] },
      { onConflict: "app_id,category_id" },
    );
  }
  await db.from("screens").delete().eq("app_id", data.id);
  return data;
}

async function saveCapture({ app, appRow, name, png, meta, isHighlight, typeSlug, typeBySlug }) {
  const path = `${app.slug}/web-${name}.png`;
  const url = await upload(path, png, "image/png");
  const screen = await insertScreen(
    { app_id: appRow.id, image_url: url, platform: "web", is_highlight: isHighlight },
    { title: meta?.title ?? null, description: meta?.description ?? null, page_url: meta?.pageUrl ?? null },
  );
  metadataStore[url] = { title: meta?.title ?? null, description: meta?.description ?? null, page_url: meta?.pageUrl ?? null };
  if (typeSlug && typeBySlug[typeSlug]) {
    await db.from("screen_screen_types").insert({ screen_id: screen.id, screen_type_id: typeBySlug[typeSlug] });
  }
}

/* ---------- capture modes ---------- */

async function captureScripted(browser, target, catBySlug, typeBySlug) {
  const appRow = await upsertApp(target.app, target.iconSvg, catBySlug);
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, userAgent: USER_AGENT });
  const page = await context.newPage();
  let captured = 0;
  try {
    for (const step of target.steps) {
      await step.run(page);
      const png = await page.screenshot({ type: "png" });
      const meta = await page.evaluate(() => ({
        title: document.title || null,
        description: document.querySelector('meta[name="description"]')?.content || null,
      }));
      await saveCapture({
        app: target.app, appRow, name: step.name, png,
        meta: { ...meta, pageUrl: page.url() },
        isHighlight: Boolean(step.highlight), typeSlug: step.type, typeBySlug,
      });
      captured++;
    }
  } finally {
    await context.close();
  }
  return captured;
}

async function captureSite(browser, target, catBySlug, typeBySlug) {
  const { app } = target;
  const appRow = await upsertApp(app, target.iconSvg, catBySlug);
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, userAgent: USER_AGENT });
  const page = await context.newPage();
  const seen = new Set();
  let captured = 0;

  const queue = target.paths.map((p) => new URL(p, app.website_url + "/").href);

  try {
    for (let i = 0; i < queue.length && captured < MAX_SCREENS && i < 40; i++) {
      const url = queue[i];
      try {
        const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        if (resp && resp.status() >= 400) continue;
        await page.waitForTimeout(captured === 0 ? 4000 : 2500);

        const finalUrl = page.url();
        const key = finalUrl.replace(/[#?].*$/, "").replace(/\/+$/, "");
        if (seen.has(key)) continue;
        seen.add(key);

        const pathname = new URL(finalUrl).pathname;
        const isHome = captured === 0;
        const meta = await page.evaluate(() => ({
          title: document.title || null,
          description:
            document.querySelector('meta[name="description"]')?.content ||
            document.querySelector('meta[property="og:description"]')?.content ||
            null,
        }));
        const png = await page.screenshot({ type: "png" });
        const slugName =
          `${String(captured).padStart(2, "0")}-` +
          (pathname.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home");

        await saveCapture({
          app, appRow, name: slugName, png,
          meta: { ...meta, pageUrl: finalUrl },
          isHighlight: isHome && Boolean(target.highlight),
          typeSlug: typeForPath(pathname, isHome), typeBySlug,
        });
        captured++;

        // discover more same-site links from the homepage
        if (isHome) {
          const host = new URL(finalUrl).hostname;
          const links = await page.$$eval("a[href]", (as) => as.map((a) => a.href));
          const extra = [...new Set(links)]
            .filter((h) => {
              try {
                const u = new URL(h);
                return (
                  u.hostname === host && !SKIP_LINK.test(h) &&
                  u.pathname.length > 1 && u.pathname.split("/").filter(Boolean).length <= 2 &&
                  !queue.includes(u.origin + u.pathname)
                );
              } catch { return false; }
            })
            .slice(0, 25)
            .map((h) => { const u = new URL(h); return u.origin + u.pathname; });
          queue.push(...extra);
        }
      } catch {
        continue; // one bad page never kills the target
      }
    }
  } finally {
    await context.close();
  }

  if (captured === 0) await db.from("apps").delete().eq("id", appRow.id);
  return captured;
}

/* ---------- main ---------- */

async function main() {
  console.log(`Multi-page capture → ${URL_}`);
  await db.from("categories").upsert(ENSURE_CATEGORIES, { onConflict: "slug" });

  const { data: screenTypes } = await db.from("screen_types").select("id, slug");
  const typeBySlug = Object.fromEntries((screenTypes ?? []).map((t) => [t.slug, t.id]));
  const { data: categories } = await db.from("categories").select("id, slug");
  const catBySlug = Object.fromEntries((categories ?? []).map((c) => [c.slug, c.id]));

  const browser = await chromium.launch();
  const results = [];

  for (let i = 0; i < TARGETS.length; i += CONCURRENCY) {
    const chunk = TARGETS.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(
      chunk.map(async (target) => {
        try {
          const n = target.steps
            ? await captureScripted(browser, target, catBySlug, typeBySlug)
            : await captureSite(browser, target, catBySlug, typeBySlug);
          console.log(`✓ ${target.app.name}: ${n} screens`);
          return { name: target.app.name, n };
        } catch (err) {
          console.log(`✗ ${target.app.name}: ${err.message.split("\n")[0]}`);
          return { name: target.app.name, n: 0 };
        }
      }),
    );
    results.push(...settled);
    writeFileSync("capture/metadata.json", JSON.stringify(metadataStore, null, 1));
  }

  await browser.close();
  writeFileSync("capture/metadata.json", JSON.stringify(metadataStore, null, 1));
  const total = results.reduce((s, r) => s + r.n, 0);
  console.log(`\nDone: ${total} screens across ${results.filter((r) => r.n > 0).length} targets.`);
  console.log("If descriptions are missing in the app: run supabase/migrations/003_screen_metadata.sql, then `node capture/backfill-metadata.mjs`.");
}

main().catch((err) => {
  console.error("Capture failed:", err.message);
  process.exit(1);
});
