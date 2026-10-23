import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";
import { logger } from "../logger.js";

// Admin client — has service_role access, bypasses RLS
// NEVER expose this to the browser
let _supabase = null;

export function getSupabase() {
  if (_supabase) return _supabase;

  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
    logger.warn("Supabase not configured — conversation history and auth persistence disabled");
    return null;
  }

  _supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabase;
}
