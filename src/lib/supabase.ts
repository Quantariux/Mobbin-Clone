import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * True once VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set in .env.
 * The app renders a setup notice instead of white-screening when they're
 * missing — no invented placeholder credentials.
 */
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(
            "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and restart the dev server.",
          );
        },
      },
    ) as SupabaseClient);
