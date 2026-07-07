/**
 * Seed script for the Loupe Supabase backend — screens only, per platform.
 *
 * Usage:  node supabase/seed.mjs
 *
 * Reads VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env (or the
 * process environment). Requires supabase/schema.sql applied first.
 * Idempotent: re-running replaces seeded screens.
 *
 * Every app gets a set of screens PER PLATFORM it supports:
 *   ios -> 390x844 phone mockups, web -> 1440x900 browser-page mockups.
 * All images are generated here as SVGs — invented layouts and invented app
 * names, no real app screenshots or brands. Android is intentionally not
 * seeded yet ("Android later").
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

/* ---------- shared SVG helpers ---------- */

const bar = (x, y, w, h = 16, fill = "#e4e4e7", rx = 8) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;

const bars = (x, y, widths, opts = {}) => {
  const { h = 16, gap = 12, fill = "#e4e4e7" } = opts;
  return widths.map((w, i) => bar(x, y + i * (h + gap), w, h, fill)).join("");
};

const circle = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;

const text = (x, y, size, weight, fill, content, anchor = "start") =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${content}</text>`;

/* ---------- iOS generators (390x844) ---------- */

const W = 390;
const H = 844;

const statusBar = () => `
  ${text(32, 42, 17, "bold", "#111111", "9:41")}
  <rect x="318" y="28" width="26" height="14" rx="4" fill="none" stroke="#111111" stroke-width="2"/>
  <rect x="321" y="31" width="16" height="8" rx="2" fill="#111111"/>
  <rect x="292" y="30" width="18" height="11" rx="2" fill="#111111"/>`;

const phoneFrame = (bg, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${bg}"/>${body}</svg>`;

const phoneButton = (y, label, fill, textFill = "#ffffff", x = 32, w = W - 64) =>
  `<rect x="${x}" y="${y}" width="${w}" height="56" rx="28" fill="${fill}"/>
   ${text(x + w / 2, y + 36, 17, "bold", textFill, label, "middle")}`;

const IOS = {
  welcome: (p) =>
    phoneFrame(
      p.soft,
      statusBar() +
        circle(W / 2, 260, 64, p.accent) +
        circle(W / 2, 260, 26, "#ffffff") +
        text(W / 2, 410, 34, "bold", "#111111", p.name, "middle") +
        bars(75, 445, [240], { h: 14, fill: "#c9c9cf" }) +
        bars(105, 471, [180], { h: 14, fill: "#c9c9cf" }) +
        phoneButton(660, "Get started", "#111111") +
        phoneButton(730, "I already have an account", "#ffffff", "#111111"),
    ),

  signup: (p) =>
    phoneFrame(
      "#ffffff",
      statusBar() +
        text(32, 130, 32, "bold", "#111111", "Create account") +
        bars(32, 155, [200], { h: 14, fill: "#c9c9cf" }) +
        [0, 1, 2]
          .map(
            (i) =>
              bar(32, 220 + i * 92, 110, 12, "#c9c9cf") +
              `<rect x="32" y="${242 + i * 92}" width="${W - 64}" height="54" rx="16" fill="none" stroke="#e4e4e7" stroke-width="2"/>`,
          )
          .join("") +
        phoneButton(530, "Continue", p.accent) +
        bar(120, 620, 150, 12, "#e4e4e7") +
        `<rect x="32" y="656" width="${W - 64}" height="54" rx="27" fill="none" stroke="#e4e4e7" stroke-width="2"/>` +
        circle(70, 683, 12, "#c9c9cf") +
        bar(130, 676, 130, 14, "#c9c9cf"),
    ),

  dashboard: (p) =>
    phoneFrame(
      "#ffffff",
      statusBar() +
        circle(52, 100, 20, p.soft) +
        bars(88, 88, [120], { h: 16, fill: "#111111" }) +
        bars(88, 112, [80], { h: 10, fill: "#c9c9cf" }) +
        `<rect x="32" y="150" width="${W - 64}" height="180" rx="24" fill="${p.soft}"/>` +
        bar(56, 178, 90, 12, p.accent) +
        text(56, 248, 40, "bold", "#111111", p.bigStat) +
        bar(56, 268, 130, 12, "#8a8a93") +
        `<path d="M56 310 C 110 300, 150 270, 200 278 S 300 240, 358 232" fill="none" stroke="${p.accent}" stroke-width="5" stroke-linecap="round"/>` +
        [0, 1, 2, 3]
          .map(
            (i) =>
              circle(76, 388 + i * 84, 22, i % 2 ? p.soft : "#f2f2f3") +
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
    phoneFrame(
      "#ffffff",
      statusBar() +
        text(32, 130, 32, "bold", "#111111", "Notifications") +
        `<rect x="32" y="160" width="120" height="36" rx="18" fill="#111111"/>` +
        text(92, 184, 15, "normal", "#ffffff", "All", "middle") +
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
    phoneFrame(
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
        text(32, 255, 20, "bold", "#111111", "Sort by") +
        [0, 1, 2, 3, 4]
          .map(
            (i) =>
              bar(32, 285 + i * 64, 170, 15, "#111111") +
              `<circle cx="342" cy="${292 + i * 64}" r="12" fill="none" stroke="${i === 0 ? p.accent : "#d9d9de"}" stroke-width="2.5"/>` +
              (i === 0 ? circle(342, 292, 6, p.accent) : ""),
          )
          .join("") +
        phoneButton(640, "Show 128 results", "#111111") +
        bar(160, 730, 70, 13, "#8a8a93"),
    ),
};

/* ---------- Web generators (1440x900, browser page content) ---------- */

const WW = 1440;
const WH = 900;

const webFrame = (bg, domain, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WW} ${WH}" width="${WW}" height="${WH}">
    <rect width="${WW}" height="${WH}" fill="${bg}"/>
    <rect width="${WW}" height="64" fill="#f6f6f7"/>
    ${circle(28, 32, 6, "#dcdce0")}${circle(50, 32, 6, "#dcdce0")}${circle(72, 32, 6, "#dcdce0")}
    <rect x="520" y="18" width="400" height="30" rx="15" fill="#ececee"/>
    ${text(720, 38, 13, "normal", "#8a8a93", domain, "middle")}
    <line x1="0" y1="64" x2="${WW}" y2="64" stroke="#e4e4e7"/>
    ${body}</svg>`;

const sidebar = (p, activeRow = 0) =>
  `<rect x="0" y="64" width="240" height="${WH - 64}" fill="#fafafa"/>
   <line x1="240" y1="64" x2="240" y2="${WH}" stroke="#e4e4e7"/>
   ${circle(44, 112, 14, p.accent)}
   ${text(70, 118, 17, "bold", "#111111", p.name)}
   ${[0, 1, 2, 3, 4, 5]
     .map(
       (i) =>
         (i === activeRow
           ? `<rect x="16" y="${156 + i * 52}" width="208" height="40" rx="10" fill="${p.soft}"/>`
           : "") +
         circle(40, 176 + i * 52, 8, i === activeRow ? p.accent : "#d9d9de") +
         bar(60, 169 + i * 52, 110, 13, i === activeRow ? "#111111" : "#c9c9cf"),
     )
     .join("")}`;

const WEB = {
  welcome: (p) =>
    webFrame(
      "#ffffff",
      p.domain,
      circle(120, 118, 14, p.accent) +
        text(146, 124, 18, "bold", "#111111", p.name) +
        bars(1000, 110, [60], { h: 13, fill: "#8a8a93" }) +
        bars(1090, 110, [60], { h: 13, fill: "#8a8a93" }) +
        `<rect x="1190" y="96" width="130" height="42" rx="21" fill="#111111"/>` +
        text(1255, 122, 14, "bold", "#ffffff", "Sign up", "middle") +
        circle(WW / 2, 300, 56, p.soft) +
        circle(WW / 2, 300, 24, p.accent) +
        text(WW / 2, 430, 56, "bold", "#111111", p.headline1, "middle") +
        text(WW / 2, 495, 56, "bold", "#111111", p.headline2, "middle") +
        bars(WW / 2 - 210, 530, [420], { h: 15, fill: "#c9c9cf" }) +
        bars(WW / 2 - 140, 557, [280], { h: 15, fill: "#c9c9cf" }) +
        `<rect x="${WW / 2 - 160}" y="610" width="150" height="52" rx="26" fill="#111111"/>` +
        text(WW / 2 - 85, 642, 15, "bold", "#ffffff", "Get started", "middle") +
        `<rect x="${WW / 2 + 10}" y="610" width="150" height="52" rx="26" fill="none" stroke="#e4e4e7" stroke-width="2"/>` +
        text(WW / 2 + 85, 642, 15, "bold", "#111111", "Learn more", "middle") +
        [0, 1, 2]
          .map(
            (i) =>
              `<rect x="${320 + i * 280}" y="720" width="240" height="130" rx="18" fill="#f6f6f7"/>` +
              circle(352 + i * 280, 762, 14, p.soft) +
              bar(340 + i * 280, 792, 140, 13, "#111111") +
              bar(340 + i * 280, 814, 180, 10, "#c9c9cf"),
          )
          .join(""),
    ),

  signup: (p) =>
    webFrame(
      "#ffffff",
      p.domain + "/signup",
      `<rect x="0" y="64" width="600" height="${WH - 64}" fill="${p.soft}"/>` +
        circle(300, 380, 56, p.accent) +
        circle(300, 380, 24, "#ffffff") +
        text(300, 490, 30, "bold", "#111111", p.name, "middle") +
        bars(180, 520, [240], { h: 13, fill: "#111111", gap: 10 }) +
        bars(210, 545, [180], { h: 13, fill: "#111111" }) +
        text(1020, 280, 34, "bold", "#111111", "Create account", "middle") +
        bars(930, 305, [180], { h: 13, fill: "#c9c9cf" }) +
        [0, 1, 2]
          .map(
            (i) =>
              bar(820, 350 + i * 92, 110, 12, "#8a8a93") +
              `<rect x="820" y="${372 + i * 92}" width="400" height="52" rx="14" fill="none" stroke="#e4e4e7" stroke-width="2"/>`,
          )
          .join("") +
        `<rect x="820" y="650" width="400" height="52" rx="26" fill="${p.accent}"/>` +
        text(1020, 682, 15, "bold", "#ffffff", "Continue", "middle") +
        `<rect x="820" y="720" width="400" height="52" rx="26" fill="none" stroke="#e4e4e7" stroke-width="2"/>` +
        circle(920, 746, 11, "#c9c9cf") +
        bar(945, 739, 150, 13, "#8a8a93"),
    ),

  dashboard: (p) =>
    webFrame(
      "#ffffff",
      p.domain + "/dashboard",
      sidebar(p, 0) +
        text(280, 130, 26, "bold", "#111111", "Dashboard") +
        `<rect x="900" y="100" width="340" height="44" rx="22" fill="#f2f2f3"/>` +
        circle(926, 122, 8, "#c9c9cf") +
        bar(946, 115, 120, 13, "#c9c9cf") +
        circle(1310, 122, 20, p.soft) +
        [
          [p.bigStat, "Total this month"],
          ["7,842", "Active users"],
          ["96%", "Satisfaction"],
        ]
          .map(
            ([stat, label], i) =>
              `<rect x="${280 + i * 330}" y="170" width="300" height="120" rx="18" fill="#f6f6f7"/>` +
              bar(304 + i * 330, 194, 120, 11, "#8a8a93") +
              text(304 + i * 330, 254, 34, "bold", "#111111", stat) +
              bar(304 + i * 330, 266, 60, 10, p.accent),
          )
          .join("") +
        `<rect x="280" y="320" width="960" height="280" rx="18" fill="none" stroke="#e4e4e7" stroke-width="2"/>` +
        bar(304, 344, 130, 13, "#111111") +
        `<path d="M320 540 C 420 520, 500 460, 620 470 S 840 380, 960 390 S 1150 330, 1210 320" fill="none" stroke="${p.accent}" stroke-width="5" stroke-linecap="round"/>` +
        [0, 1, 2, 3]
          .map(
            (i) =>
              circle(304 + 16, 660 + i * 56, 14, i % 2 ? p.soft : "#f2f2f3") +
              bar(344, 652 + i * 56, 220, 13, "#111111") +
              bar(620, 652 + i * 56, 140, 11, "#c9c9cf") +
              bar(1120, 652 + i * 56, 90, 13, "#8a8a93"),
          )
          .join(""),
    ),

  notifications: (p) =>
    webFrame(
      "#ffffff",
      p.domain + "/notifications",
      sidebar(p, 2) +
        text(280, 130, 26, "bold", "#111111", "Notifications") +
        `<rect x="280" y="156" width="90" height="36" rx="18" fill="#111111"/>` +
        text(325, 179, 14, "normal", "#ffffff", "All", "middle") +
        `<rect x="380" y="156" width="110" height="36" rx="18" fill="#f2f2f3"/>` +
        bar(408, 168, 56, 12, "#8a8a93") +
        [0, 1, 2, 3, 4, 5]
          .map(
            (i) =>
              `<rect x="280" y="${220 + i * 100}" width="960" height="84" rx="14" fill="${i % 3 === 0 ? "#f6f6f7" : "#ffffff"}" stroke="#e4e4e7" stroke-width="1"/>` +
              circle(324, 262 + i * 100, 20, i % 3 === 0 ? p.soft : "#f2f2f3") +
              bar(364, 244 + i * 100, 280, 14, "#111111") +
              bar(364, 268 + i * 100, 420, 11, "#c9c9cf") +
              bar(1130, 254 + i * 100, 80, 11, "#8a8a93") +
              (i % 2 === 0 ? circle(1224, 262 + i * 100, 5, p.accent) : ""),
          )
          .join(""),
    ),

  filter: (p) =>
    webFrame(
      "#ffffff",
      p.domain + "/browse",
      `<rect x="40" y="96" width="420" height="46" rx="23" fill="#f2f2f3"/>` +
        circle(66, 119, 8, "#c9c9cf") +
        bar(86, 112, 160, 13, "#c9c9cf") +
        [0, 1, 2, 3]
          .map((i) => {
            const x = 500 + i * 120;
            const active = i === 0;
            return (
              `<rect x="${x}" y="98" width="104" height="42" rx="21" fill="${active ? "#111111" : "#ffffff"}" stroke="${active ? "#111111" : "#e4e4e7"}" stroke-width="2"/>` +
              bar(x + 26, 113, 52, 12, active ? "#ffffff" : "#8a8a93")
            );
          })
          .join("") +
        `<rect x="40" y="180" width="240" height="640" rx="18" fill="#fafafa"/>` +
        [0, 1, 2]
          .map(
            (g) =>
              bar(64, 210 + g * 200, 110, 13, "#111111") +
              [0, 1, 2]
                .map(
                  (i) =>
                    `<rect x="64" y="${240 + g * 200 + i * 44}" width="18" height="18" rx="5" fill="${g === 0 && i === 0 ? p.accent : "none"}" stroke="${g === 0 && i === 0 ? p.accent : "#c9c9cf"}" stroke-width="2"/>` +
                    bar(94, 242 + g * 200 + i * 44, 120, 12, "#8a8a93"),
                )
                .join(""),
          )
          .join("") +
        [0, 1, 2, 3, 4, 5]
          .map((i) => {
            const x = 320 + (i % 3) * 380;
            const y = 180 + Math.floor(i / 3) * 330;
            return (
              `<rect x="${x}" y="${y}" width="340" height="300" rx="18" fill="none" stroke="#e4e4e7" stroke-width="2"/>` +
              `<rect x="${x + 16}" y="${y + 16}" width="308" height="180" rx="12" fill="${i % 2 ? p.soft : "#f2f2f3"}"/>` +
              circle(x + 300, y + 44, 12, "#ffffff") +
              bar(x + 16, y + 216, 180, 14, "#111111") +
              bar(x + 16, y + 240, 120, 12, "#8a8a93") +
              bar(x + 16, y + 266, 70, 14, p.accent)
            );
          })
          .join(""),
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

const SCREEN_TYPES = [
  "Notifications",
  "Welcome & Get Started",
  "Filter & Sort",
  "Dashboard",
  "Signup",
];

// screen kind -> screen_type slug
const KIND_TYPE = {
  welcome: "welcome-get-started",
  signup: "signup",
  dashboard: "dashboard",
  notifications: "notifications",
  filter: "filter-sort",
};

const APPS = [
  {
    name: "Sprout",
    slug: "sprout",
    tagline: "Personal finance, planted right",
    accent: "#65a30d",
    soft: "#ecfccb",
    bigStat: "$12,641",
    domain: "sprout.money",
    headline1: "Money that",
    headline2: "grows with you.",
    platform: ["ios", "web"],
    rating: 4.6,
    review_count: 128,
    website_url: "https://www.sprout.money",
    categories: ["finance", "productivity"],
    highlight: ["dashboard"],
  },
  {
    name: "Wayfarer",
    slug: "wayfarer",
    tagline: "Stays, escapes, city guides",
    accent: "#0d9488",
    soft: "#ccfbf1",
    bigStat: "24 trips",
    domain: "wayfarer.travel",
    headline1: "Every stay,",
    headline2: "one search away.",
    platform: ["ios", "android", "web"],
    rating: 4.7,
    review_count: 96,
    website_url: "https://www.wayfarer.travel",
    categories: ["travel-transportation"],
    highlight: ["welcome", "dashboard"],
  },
  {
    name: "Nibbly",
    slug: "nibbly",
    tagline: "Food & groceries in minutes",
    accent: "#ea580c",
    soft: "#ffedd5",
    bigStat: "18 min",
    domain: "nibbly.eats",
    headline1: "Dinner, delivered",
    headline2: "before you're hungry.",
    platform: ["ios", "android"],
    rating: 4.4,
    review_count: 212,
    website_url: "https://www.nibbly.eats",
    categories: ["food-drink", "shopping"],
    highlight: ["dashboard"],
  },
  {
    name: "Chronicle",
    slug: "chronicle",
    tagline: "Local news & live video",
    accent: "#475569",
    soft: "#e2e8f0",
    bigStat: "42 stories",
    domain: "chronicle.news",
    headline1: "Your city,",
    headline2: "as it happens.",
    platform: ["ios", "web"],
    rating: 4.2,
    review_count: 74,
    website_url: "https://www.chronicle.news",
    categories: ["news-media"],
    highlight: ["notifications"],
  },
  {
    name: "Stride",
    slug: "stride",
    tagline: "Daily activity, beautifully tracked",
    accent: "#e11d48",
    soft: "#ffe4e6",
    bigStat: "7,842",
    domain: "stride.fit",
    headline1: "Every step,",
    headline2: "counted.",
    platform: ["ios"],
    rating: 4.8,
    review_count: 156,
    website_url: "https://www.stride.fit",
    categories: ["health-fitness"],
    highlight: ["dashboard"],
  },
  {
    name: "Quanta",
    slug: "quanta",
    tagline: "The marketplace for makers",
    accent: "#7c3aed",
    soft: "#ede9fe",
    bigStat: "$482",
    domain: "quanta.shop",
    headline1: "Made by hand,",
    headline2: "found by you.",
    platform: ["web"],
    rating: 4.3,
    review_count: 63,
    website_url: "https://www.quanta.shop",
    categories: ["shopping"],
    highlight: ["filter"],
  },
];

const KINDS = ["welcome", "signup", "dashboard", "notifications", "filter"];
const SEEDED_PLATFORMS = ["ios", "web"]; // android later

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

  const { error: bucketErr } = await db.storage.createBucket("screens", { public: true });
  if (bucketErr && !/already exists/i.test(bucketErr.message)) {
    throw new Error(`bucket: ${bucketErr.message}`);
  }
  console.log("✓ bucket 'screens' ready");

  // taxonomies (screens only — no ui_elements, no flows)
  const categories = await upsert(
    "categories",
    CATEGORIES.map((name) => ({ name, slug: slugify(name) })),
    "slug",
  );
  const screenTypes = await upsert(
    "screen_types",
    SCREEN_TYPES.map((name) => ({ name, slug: slugify(name) })),
    "slug",
  );
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));
  const typeBySlug = Object.fromEntries(screenTypes.map((t) => [t.slug, t.id]));
  console.log(`✓ ${categories.length} categories, ${screenTypes.length} screen_types`);

  // apps
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

  // reset previously seeded content; purge legacy ui_elements/flows rows if
  // the tables still exist (they're dropped by migrations/002_screens_only.sql)
  const appIds = apps.map((a) => a.id);
  await db.from("screens").delete().in("app_id", appIds);
  for (const legacy of ["flows", "ui_elements"]) {
    const { error } = await db.from(legacy).delete().not("id", "is", null);
    if (error && !/find the table/i.test(error.message)) {
      console.warn(`  (skip ${legacy} cleanup: ${error.message})`);
    }
  }

  // app_categories
  await upsert(
    "app_categories",
    APPS.flatMap((a) =>
      a.categories.map((c) => ({ app_id: appBySlug[a.slug].id, category_id: catBySlug[c] })),
    ),
    "app_id,category_id",
  );

  // screens per app per supported platform, tagged with screen_types
  let iosCount = 0;
  let webCount = 0;
  for (const app of APPS) {
    const appId = appBySlug[app.slug].id;
    for (const platform of SEEDED_PLATFORMS) {
      if (!app.platform.includes(platform)) continue;
      const generators = platform === "ios" ? IOS : WEB;
      const rows = [];
      for (const kind of KINDS) {
        const url = await upload(`${app.slug}/${platform}-${kind}.svg`, generators[kind](app));
        rows.push({
          app_id: appId,
          image_url: url,
          platform,
          is_highlight: app.highlight.includes(kind),
        });
      }
      const screens = await insert("screens", rows);
      await insert(
        "screen_screen_types",
        screens.map((s, i) => ({
          screen_id: s.id,
          screen_type_id: typeBySlug[KIND_TYPE[KINDS[i]]],
        })),
      );
      if (platform === "ios") iosCount += screens.length;
      else webCount += screens.length;
    }
  }
  console.log(`✓ ${iosCount} iOS screens + ${webCount} web screens uploaded, inserted and tagged`);
  console.log("Done.");
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
