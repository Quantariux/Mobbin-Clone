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

export async function getUiElements() {
  const { data, error } = await supabase.from("ui_elements").select("*").order("name");
  if (error) throw error;
  return data;
}

/** Distinct flow names across apps (flow slugs repeat per app by design). */
export async function getFlowKinds() {
  const { data, error } = await supabase.from("flows").select("name, slug").order("name");
  if (error) throw error;
  const seen = new Set<string>();
  return data.filter((f) => (seen.has(f.slug) ? false : (seen.add(f.slug), true)));
}

/* ------------------------------------------------------------------ */
/* Apps                                                                */
/* ------------------------------------------------------------------ */

const APP_CARD_SELECT =
  "*, app_categories(categories(name, slug)), screens(id, image_url, is_highlight, platform)";

const APP_ORDER: Record<string, { column: string }> = {
  latest: { column: "created_at" },
  popular: { column: "review_count" },
  rated: { column: "rating" },
};

export async function getApps({ platform, sort = "latest" }: { platform?: string; sort?: string } = {}) {
  const { column } = APP_ORDER[sort] ?? APP_ORDER.latest;
  let query = supabase
    .from("apps")
    .select(APP_CARD_SELECT)
    .order(column, { ascending: false, nullsFirst: false });
  if (platform) query = query.contains("platform", [platform]);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getAppsByCategory(categorySlug: string) {
  const { data, error } = await supabase
    .from("app_categories")
    .select(`apps(${APP_CARD_SELECT}), categories!inner(slug)`)
    .eq("categories.slug", categorySlug);
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
      screens(
        id, image_url, platform, is_highlight, created_at,
        screen_ui_elements(ui_elements(name, slug)),
        screen_screen_types(screen_types(name, slug))
      ),
      flows(id, name, slug, flow_screens(position, screens(id, image_url)))
    `,
    )
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}

export async function searchApps(query: string) {
  // ilike inside .or() — strip characters that would break the filter syntax
  const q = query.replace(/[,%()]/g, " ").trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from("apps")
    .select(APP_CARD_SELECT)
    .or(`name.ilike.%${q}%,tagline.ilike.%${q}%`);
  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------------ */
/* Screens filtered through join tables (DB-side, not client .filter)  */
/* ------------------------------------------------------------------ */

export async function getScreensByUiElement(slug: string) {
  const { data, error } = await supabase
    .from("screen_ui_elements")
    .select("screens(*, apps(name, slug, icon_url)), ui_elements!inner(slug)")
    .eq("ui_elements.slug", slug);
  if (error) throw error;
  return data.map((row) => row.screens);
}

export async function getScreensByScreenType(slug: string) {
  const { data, error } = await supabase
    .from("screen_screen_types")
    .select("screens(*, apps(name, slug, icon_url)), screen_types!inner(slug)")
    .eq("screen_types.slug", slug);
  if (error) throw error;
  return data.map((row) => row.screens);
}

export async function getScreensByFlow(slug: string) {
  const { data, error } = await supabase
    .from("flow_screens")
    .select("position, screens(*, apps(name, slug, icon_url)), flows!inner(slug, name)")
    .eq("flows.slug", slug)
    .order("position");
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
