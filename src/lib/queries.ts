import { supabase } from "./supabase";

/* ------------------------------------------------------------------ */
/* Taxonomies (filter panel)                                           */
/* ------------------------------------------------------------------ */

export async function getCategories() {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function getScreenTypes() {
  const { data, error } = await supabase.from("screen_types").select("*").order("name");
  if (error) throw error;
  return data;
}

/** Live library totals for the landing page — no hardcoded marketing numbers. */
export async function getStats() {
  const [apps, ios, web] = await Promise.all([
    supabase.from("apps").select("*", { count: "exact", head: true }),
    supabase.from("screens").select("*", { count: "exact", head: true }).eq("platform", "ios"),
    supabase.from("screens").select("*", { count: "exact", head: true }).eq("platform", "web"),
  ]);
  const error = apps.error ?? ios.error ?? web.error;
  if (error) throw error;
  return {
    apps: apps.count ?? 0,
    iosScreens: ios.count ?? 0,
    webScreens: web.count ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/* Apps (always scoped to the selected platform)                       */
/* ------------------------------------------------------------------ */

const APP_CARD_SELECT =
  "*, app_categories(categories(name, slug)), screens(id, image_url, is_highlight, platform)";

const APP_ORDER: Record<string, { column: string }> = {
  latest: { column: "created_at" },
  popular: { column: "review_count" },
  rated: { column: "rating" },
};

export async function getApps({ platform, sort = "latest" }: { platform: string; sort?: string }) {
  const { column } = APP_ORDER[sort] ?? APP_ORDER.latest;
  const { data, error } = await supabase
    .from("apps")
    .select(APP_CARD_SELECT)
    .contains("platform", [platform])
    .order(column, { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data;
}

export async function getAppsByCategory(categorySlug: string, platform: string) {
  const { data, error } = await supabase
    .from("app_categories")
    .select(`apps!inner(${APP_CARD_SELECT}), categories!inner(slug)`)
    .eq("categories.slug", categorySlug)
    .contains("apps.platform", [platform]);
  if (error) throw error;
  return data.map((row) => row.apps);
}

export async function getAppBySlug(slug: string) {
  const { data, error } = await supabase
    .from("apps")
    .select(
      `
      *,
      app_categories(categories(name, slug)),
      screens(*, screen_screen_types(screen_types(name, slug)))
    `,
    )
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}

export async function searchApps(query: string, platform: string) {
  // ilike inside .or() — strip characters that would break the filter syntax
  const q = query.replace(/[,%()]/g, " ").trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from("apps")
    .select(APP_CARD_SELECT)
    .contains("platform", [platform])
    .or(`name.ilike.%${q}%,tagline.ilike.%${q}%`);
  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------------ */
/* Screens filtered through join tables (DB-side, not client .filter)  */
/* ------------------------------------------------------------------ */

export async function getScreensByScreenType(slug: string, platform: string) {
  const { data, error } = await supabase
    .from("screen_screen_types")
    .select(
      "screens!inner(*, apps(name, slug, icon_url, tagline, website_url)), screen_types!inner(slug)",
    )
    .eq("screen_types.slug", slug)
    .eq("screens.platform", platform);
  if (error) throw error;
  return data.map((row) => row.screens);
}

/* ------------------------------------------------------------------ */
/* Collections (RLS scopes everything to auth.uid())                   */
/* ------------------------------------------------------------------ */

export async function getUserCollections() {
  const { data, error } = await supabase
    .from("collections")
    .select("*, collection_screens(screen_id, added_at)")
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function createCollection(name = "My Collection") {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Sign in to save screens.");
  const { data, error } = await supabase
    .from("collections")
    .insert({ name, user_id: userData.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveScreenToCollection(collectionId: string, screenId: string) {
  const { error } = await supabase
    .from("collection_screens")
    .upsert({ collection_id: collectionId, screen_id: screenId });
  if (error) throw error;
}

export async function removeScreenFromCollection(collectionId: string, screenId: string) {
  const { error } = await supabase
    .from("collection_screens")
    .delete()
    .eq("collection_id", collectionId)
    .eq("screen_id", screenId);
  if (error) throw error;
}
