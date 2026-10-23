import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Browser client — only uses the public anon key.
// Returns null gracefully if not configured yet.
export const supabase =
  supabaseUrl && supabaseAnon && supabaseAnon !== "replace_with_your_anon_public_key"
    ? createClient(supabaseUrl, supabaseAnon)
    : null;
