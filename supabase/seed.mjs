/**
 * Seed script for the Loupe Supabase backend.
 *
 * Usage:  node supabase/seed.mjs
 *
 * Reads VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env (or the
 * process environment). Requires the schema in supabase/schema.sql to have
 * been applied first. Idempotent: re-running replaces seeded screens/flows.
 *
 * All images are generated in this file as simple SVG mockups — invented
 * layouts and invented app names, no real app screenshots or brands.
 */
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
const URL = env.VITE_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error(
    "Missing credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY " +
      "in .env (project root) or the environment, then re-run.",
  );
  process.exit(1);
}

const db = createClient(URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* ---------- SVG generators (invented mockups) ---------- */

const W = 390;
const H = 844;

const bar = (x, y, w, h = 16, fill = "#e4e4e7", rx = 8) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;

const bars = (x, y, widths, opts = {}) => {
  const { h = 16, gap = 12, fill = "#e4e4e7" } = opts;
  return widths.map((w, i) => bar(x, y + i * (h + gap), w, h, fill)).join("");
};

const circle = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;

const statusBar = (dark = false) => {
  const c = dark ? "#ffffff" : "#111111";
  return `
    <text x="32" y="42" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="${c}">9:41</text>
    <rect x="318" y="28" width="26" height="14" rx="4" fill="none" stroke="${c}" stroke-width="2"/>
    <rect x="321" y="31" width="16" height="8" rx="2" fill="${c}"/>
    <rect x="292" y="30" width="18" height="11" rx="2" fill="${c}"/>`;
};

const frame = (bg, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${bg}"/>${body}</svg>`;

const button = (y, label, fill, textFill = "#ffffff", x = 32, w = W - 64) =>
  `<rect x="${x}" y="${y}" width="${w}" height="56" rx="28" fill="${fill}"/>
   <text x="${x + w / 2}" y="${y + 36}" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="${textFill}">${label}</text>`;

const GENERATORS = {
  welcome: (p) =>
    frame(
      p.soft,
      statusBar() +
        circle(W / 2, 260, 64, p.accent) +
        circle(W / 2, 260, 26, "#ffffff") +
        `<text x="${W / 2}" y="410" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="#111111">${p.appName}</text>` +
        bars(75, 445, [240], { h: 14, fill: "#c9c9cf" }) +
        bars(105, 471, [180], { h: 14, fill: "#c9c9cf" }) +
        button(660, "Get started", "#111111") +
        button(730, "I already have an account", "#ffffff", "#111111"),
    ),

  signup: (p) =>
    frame(
      "#ffffff",
      statusBar() +
        `<text x="32" y="130" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#111111">Create account</text>` +
        bars(32, 155, [200], { h: 14, fill: "#c9c9cf" }) +
        [0, 1, 2]
          .map(
            (i) =>
              bar(32, 220 + i * 92, 110, 12, "#c9c9cf") +
              `<rect x="32" y="${242 + i * 92}" width="${W - 64}" height="54" rx="16" fill="none" stroke="#e4e4e7" stroke-width="2"/>`,
          )
          .join("") +
        button(530, "Continue", p.accent) +
        bar(120, 620, 150, 12, "#e4e4e7") +
        `<rect x="32" y="656" width="${W - 64}" height="54" rx="27" fill="none" stroke="#e4e4e7" stroke-width="2"/>` +
        circle(70, 683, 12, "#c9c9cf") +
        bar(130, 676, 130, 14, "#c9c9cf"),
    ),

  dashboard: (p) =>
    frame(
      "#ffffff",
      statusBar() +
        circle(52, 100, 20, p.soft) +
        bars(88, 88, [120], { h: 16, fill: "#111111" }) +
        bars(88, 112, [80], { h: 10, fill: "#c9c9cf" }) +
        `<rect x="32" y="150" width="${W - 64}" height="180" rx="24" fill="${p.soft}"/>` +
        bar(56, 178, 90, 12, p.accent) +
        `<text x="56" y="248" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#111111">${p.bigStat}</text>` +
        bar(56, 268, 130, 12, "#8a8a93") +
        `<path d="M56 310 C 110 300, 150 270, 200 278 S 300 240, 358 232" fill="none" stroke="${p.accent}" stroke-width="5" stroke-linecap="round"/>` +
        [0, 1, 2, 3]
          .map(
            (i) =>
              circle(56 + 20, 388 + i * 84, 22, i % 2 ? p.soft : "#f2f2f3") +
              bar(116, 372 + i * 84, 150, 14, "#111111") +
              bar(116, 394 + i * 84, 100, 10, "#c9c9cf") +
              bar(300, 380 + i * 84, 58, 14, "#8a8a93"),
          )
          .join("") +
        `<rect x="0" y="${H - 84}" width="${W}" height="84" fill="#ffffff" stroke="#e4e4e7"/>` +
        [0, 1, 2, 3]
          .map((i) => circle(65 + i * 87, H - 42, 14, i === 0 ? p.accent : "#d9d9de"))
          .join(""),
    ),

  notifications: (p) =>
    frame(
      "#ffffff",
      statusBar() +
        `<text x="32" y="130" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#111111">Notifications</text>` +
        `<rect x="32" y="160" width="120" height="36" rx="18" fill="#111111"/>` +
        `<text x="92" y="184" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#ffffff">All</text>` +
        `<rect x="162" y="160" width="120" height="36" rx="18" fill="#f2f2f3"/>` +
        bar(196, 172, 52, 12, "#8a8a93") +
        [0, 1, 2, 3, 4, 5]
          .map(
            (i) =>
              circle(56, 260 + i * 92, 24, i % 3 === 0 ? p.soft : "#f2f2f3") +
              bar(100, 242 + i * 92, 190, 14, "#111111") +
              bar(100, 265 + i * 92, 240, 11, "#c9c9cf") +
              (i % 2 === 0 ? circle(348, 256 + i * 92, 5, p.accent) : ""),
          )
          .join(""),
    ),

  filter: (p) =>
    frame(
      "#ffffff",
      statusBar() +
        `<rect x="32" y="90" width="${W - 64}" height="52" rx="26" fill="#f2f2f3"/>` +
        circle(60, 116, 9, "#c9c9cf") +
        bar(84, 109, 140, 14, "#c9c9cf") +
        [0, 1, 2, 3]
          .map((i) => {
            const x = 32 + i * 88;
            const active = i === 1;
            return (
              `<rect x="${x}" y="162" width="80" height="38" rx="19" fill="${active ? p.accent : "#ffffff"}" stroke="${active ? p.accent : "#e4e4e7"}" stroke-width="2"/>` +
              bar(x + 18, 175, 44, 12, active ? "#ffffff" : "#8a8a93")
            );
          })
          .join("") +
        `<text x="32" y="255" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#111111">Sort by</text>` +
        [0, 1, 2, 3, 4]
          .map(
            (i) =>
              bar(32, 285 + i * 64, 170, 15, "#111111") +
              `<circle cx="342" cy="${292 + i * 64}" r="12" fill="none" stroke="${i === 0 ? p.accent : "#d9d9de"}" stroke-width="2.5"/>` +
              (i === 0 ? circle(342, 292, 6, p.accent) : ""),
          )
          .join("") +
        button(640, "Show 128 results", "#111111") +
        bar(160, 730, 70, 13, "#8a8a93"),
    ),
};

/* ---------- app icon generator ---------- */

const GLYPHS = {
  sprout:
    '<path d="M48 74 V46 M48 46 C48 32 60 24 74 26 C72 40 62 48 48 46 M48 54 C48 40 36 32 22 34 C24 48 34 56 48 54" stroke="#ffffff" stroke-width="7" fill="none" stroke-linecap="round"/>',
  chronicle:
    '<rect x="24" y="26" width="48" height="44" rx="8" fill="#ffffff"/><rect x="30" y="34" width="22" height="16" rx="4" fill="{accent}"/><rect x="30" y="56" width="36" height="5" rx="2.5" fill="{accent}"/>',
  nibbly:
    '<circle cx="48" cy="48" r="24" fill="none" stroke="#ffffff" stroke-width="7"/><path d="M48 34 V48 L58 56" stroke="#ffffff" stroke-width="7" fill="none" stroke-linecap="round"/>',
  stride:
    '<path d="M22 62 L38 40 L50 54 L60 44 L74 62" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  wayfarer:
    '<circle cx="62" cy="32" r="9" fill="#ffffff"/><path d="M16 72 L38 40 L52 58 L62 46 L82 72 Z" fill="#ffffff"/>',
  quanta:
    '<path d="M48 18 C51 34 62 45 78 48 C62 51 51 62 48 78 C45 62 34 51 18 48 C34 45 45 34 48 18 Z" fill="#ffffff"/>',
};

const iconSVG = (slug, accent) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
    <rect width="96" height="96" rx="21" fill="${accent}"/>${GLYPHS[slug].replace(/\{accent\}/g, accent)}</svg>`;

/* ---------- seed data (all invented) ---------- */

const CATEGORIES = [
  "Travel & Transportation",
  "Health & Fitness",
  "Shopping",
  "Finance",
  "Food & Drink",
  "News & Media",
  "Productivity",
];

const UI_ELEMENTS = ["Stacked List", "Tab Bar", "Table", "Banner", "Button"];

const SCREEN_TYPES = [
  "Notifications",
  "Welcome & Get Started",
  "Filter & Sort",
  "Dashboard",
  "Signup",
];

// screen kind -> screen_type slug + ui_element slugs
const KIND_TAGS = {
  welcome: { type: "welcome-get-started", elements: ["button", "banner"] },
  signup: { type: "signup", elements: ["button"] },
  dashboard: { type: "dashboard", elements: ["stacked-list", "tab-bar"] },
  notifications: { type: "notifications", elements: ["stacked-list"] },
  filter: { type: "filter-sort", elements: ["button", "table"] },
};

const APPS = [
  {
    name: "Sprout",
    slug: "sprout",
    tagline: "Personal finance, planted right",
    accent: "#65a30d",
    soft: "#ecfccb",
    bigStat: "$12,641",
    platform: ["ios", "web"],
    rating: 4.6,
    review_count: 128,
    website_url: "https://www.sprout.money",
    categories: ["finance", "productivity"],
    highlight: ["dashboard"],
    flows: [
      { name: "Onboarding", slug: "onboarding", kinds: ["welcome", "signup", "dashboard"] },
      { name: "Filtering & Sorting", slug: "filtering-sorting", kinds: ["filter", "dashboard"] },
    ],
  },
  {
    name: "Wayfarer",
    slug: "wayfarer",
    tagline: "Stays, escapes, city guides",
    accent: "#0d9488",
    soft: "#ccfbf1",
    bigStat: "24 trips",
    platform: ["ios", "android", "web"],
    rating: 4.7,
    review_count: 96,
    website_url: "https://www.wayfarer.travel",
    categories: ["travel-transportation"],
    highlight: ["welcome", "dashboard"],
    flows: [
      { name: "Creating Account", slug: "creating-account", kinds: ["welcome", "signup"] },
      { name: "Filtering & Sorting", slug: "filtering-sorting", kinds: ["filter", "dashboard"] },
    ],
  },
  {
    name: "Nibbly",
    slug: "nibbly",
    tagline: "Food & groceries in minutes",
    accent: "#ea580c",
    soft: "#ffedd5",
    bigStat: "18 min",
    platform: ["ios", "android"],
    rating: 4.4,
    review_count: 212,
    website_url: "https://www.nibbly.eats",
    categories: ["food-drink", "shopping"],
    highlight: ["dashboard"],
    flows: [
      { name: "Onboarding", slug: "onboarding", kinds: ["welcome", "signup", "dashboard"] },
    ],
  },
  {
    name: "Chronicle",
    slug: "chronicle",
    tagline: "Local news & live video",
    accent: "#475569",
    soft: "#e2e8f0",
    bigStat: "42 stories",
    platform: ["ios", "web"],
    rating: 4.2,
    review_count: 74,
    website_url: "https://www.chronicle.news",
    categories: ["news-media"],
    highlight: ["notifications"],
    flows: [
      { name: "Logging In", slug: "logging-in", kinds: ["welcome", "signup"] },
    ],
  },
  {
    name: "Stride",
    slug: "stride",
    tagline: "Daily activity, beautifully tracked",
    accent: "#e11d48",
    soft: "#ffe4e6",
    bigStat: "7,842",
    platform: ["ios"],
    rating: 4.8,
    review_count: 156,
    website_url: "https://www.stride.fit",
    categories: ["health-fitness"],
    highlight: ["dashboard"],
    flows: [
      { name: "Onboarding", slug: "onboarding", kinds: ["welcome", "signup", "dashboard"] },
      { name: "Editing Profile", slug: "editing-profile", kinds: ["dashboard", "filter"] },
    ],
  },
  {
    name: "Quanta",
    slug: "quanta",
    tagline: "The marketplace for makers",
    accent: "#7c3aed",
    soft: "#ede9fe",
    bigStat: "$482",
    platform: ["web"],
    rating: 4.3,
    review_count: 63,
    website_url: "https://www.quanta.shop",
    categories: ["shopping"],
    highlight: ["filter"],
    flows: [
      { name: "Filtering & Sorting", slug: "filtering-sorting", kinds: ["filter", "dashboard"] },
    ],
  },
];

const KINDS_PER_APP = ["welcome", "signup", "dashboard", "notifications", "filter"];

const slugify = (s) =>
  s.toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ---------- helpers ---------- */

async function upsert(table, rows, conflict) {
  const { data, error } = await db.from(table).upsert(rows, { onConflict: conflict }).select();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

async function insert(table, rows) {
  if (!rows.length) return [];
  const { data, error } = await db.from(table).insert(rows).select();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

async function upload(path, svg) {
  const { error } = await db.storage
    .from("screens")
    .upload(path, Buffer.from(svg), { contentType: "image/svg+xml", upsert: true });
  if (error) throw new Error(`upload ${path}: ${error.message}`);
  return db.storage.from("screens").getPublicUrl(path).data.publicUrl;
}

/* ---------- main ---------- */

async function main() {
  console.log("Seeding", URL);

  // STEP 2 — public storage bucket
  const { error: bucketErr } = await db.storage.createBucket("screens", { public: true });
  if (bucketErr && !/already exists/i.test(bucketErr.message)) {
    throw new Error(`bucket: ${bucketErr.message}`);
  }
  console.log("✓ bucket 'screens' ready");

  // taxonomies
  const categories = await upsert(
    "categories",
    CATEGORIES.map((name) => ({ name, slug: slugify(name) })),
    "slug",
  );
  const uiElements = await upsert(
    "ui_elements",
    UI_ELEMENTS.map((name) => ({ name, slug: slugify(name) })),
    "slug",
  );
  const screenTypes = await upsert(
    "screen_types",
    SCREEN_TYPES.map((name) => ({ name, slug: slugify(name) })),
    "slug",
  );
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));
  const elBySlug = Object.fromEntries(uiElements.map((e) => [e.slug, e.id]));
  const typeBySlug = Object.fromEntries(screenTypes.map((t) => [t.slug, t.id]));
  console.log(
    `✓ ${categories.length} categories, ${uiElements.length} ui_elements, ${screenTypes.length} screen_types`,
  );

  // apps (icons uploaded first so icon_url is set on insert)
  const appRows = [];
  for (const app of APPS) {
    const iconUrl = await upload(`icons/${app.slug}.svg`, iconSVG(app.slug, app.accent));
    appRows.push({
      name: app.name,
      slug: app.slug,
      tagline: app.tagline,
      icon_url: iconUrl,
      platform: app.platform,
      rating: app.rating,
      review_count: app.review_count,
      website_url: app.website_url,
    });
  }
  const apps = await upsert("apps", appRows, "slug");
  const appBySlug = Object.fromEntries(apps.map((a) => [a.slug, a]));
  console.log(`✓ ${apps.length} apps`);

  // reset previously seeded screens/flows so re-runs stay clean
  const appIds = apps.map((a) => a.id);
  await db.from("screens").delete().in("app_id", appIds);
  await db.from("flows").delete().in("app_id", appIds);

  // app_categories
  await upsert(
    "app_categories",
    APPS.flatMap((a) =>
      a.categories.map((c) => ({ app_id: appBySlug[a.slug].id, category_id: catBySlug[c] })),
    ),
    "app_id,category_id",
  );

  // screens + tags
  let screenCount = 0;
  const screenIdByAppKind = {};
  for (const app of APPS) {
    const appId = appBySlug[app.slug].id;
    const palette = { ...app, appName: app.name };
    const rows = [];
    for (const kind of KINDS_PER_APP) {
      const url = await upload(`${app.slug}/${kind}.svg`, GENERATORS[kind](palette));
      rows.push({
        app_id: appId,
        image_url: url,
        platform: app.platform.includes("ios") ? "ios" : "web",
        is_highlight: app.highlight.includes(kind),
      });
    }
    const screens = await insert("screens", rows);
    screens.forEach((s, i) => {
      screenIdByAppKind[`${app.slug}/${KINDS_PER_APP[i]}`] = s.id;
    });
    screenCount += screens.length;

    await insert(
      "screen_screen_types",
      screens.map((s, i) => ({
        screen_id: s.id,
        screen_type_id: typeBySlug[KIND_TAGS[KINDS_PER_APP[i]].type],
      })),
    );
    await insert(
      "screen_ui_elements",
      screens.flatMap((s, i) =>
        KIND_TAGS[KINDS_PER_APP[i]].elements.map((el) => ({
          screen_id: s.id,
          ui_element_id: elBySlug[el],
        })),
      ),
    );
  }
  console.log(`✓ ${screenCount} screens uploaded, inserted and tagged`);

  // flows + flow_screens
  let flowCount = 0;
  for (const app of APPS) {
    const appId = appBySlug[app.slug].id;
    for (const flow of app.flows) {
      const [row] = await insert("flows", [{ app_id: appId, name: flow.name, slug: flow.slug }]);
      await insert(
        "flow_screens",
        flow.kinds.map((kind, i) => ({
          flow_id: row.id,
          screen_id: screenIdByAppKind[`${app.slug}/${kind}`],
          position: i + 1,
        })),
      );
      flowCount++;
    }
  }
  console.log(`✓ ${flowCount} flows with ordered flow_screens`);
  console.log("Done.");
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
