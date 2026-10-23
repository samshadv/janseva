import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { getSupabase } from "../db/supabase.js";
import { logger } from "../logger.js";

export const authRouter = Router();

// GET /api/me — returns current authenticated user profile
authRouter.get("/me", authenticate({ required: true }), async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) {
    return res.json({ id: req.user.id, email: req.user.email });
  }

  try {
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.warn({ userId: req.user.id, err: error.message }, "Error fetching profile");
    }

    return res.json({
      id: req.user.id,
      email: req.user.email,
      displayName: profile?.display_name || null,
      preferredState: profile?.preferred_state || "Not specified",
      preferredLanguage: profile?.preferred_language || "English",
      createdAt: profile?.created_at || null,
    });
  } catch (err) {
    logger.error({ userId: req.user.id, err: err.message }, "Get profile failure");
    return res.status(500).json({ error: "Failed to retrieve user profile." });
  }
});

// Preferences schema validation
const prefsSchema = z.object({
  preferredState: z.string().max(80).optional(),
  preferredLanguage: z.enum(["English", "Hindi", "Marathi"]).optional(),
  displayName: z.string().max(100).optional(),
});

// PATCH /api/me/preferences — update user preferences
authRouter.patch("/me/preferences", authenticate({ required: true }), async (req, res) => {
  const parsed = prefsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid preferences." });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.json({ ok: true, note: "Supabase not configured, preferences not stored persistently." });
  }

  try {
    const updates = {};
    if (parsed.data.preferredState !== undefined) updates.preferred_state = parsed.data.preferredState;
    if (parsed.data.preferredLanguage !== undefined) updates.preferred_language = parsed.data.preferredLanguage;
    if (parsed.data.displayName !== undefined) updates.display_name = parsed.data.displayName;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("user_profiles")
      .upsert({ id: req.user.id, email: req.user.email, ...updates });

    if (error) throw error;

    return res.json({ ok: true, preferences: updates });
  } catch (err) {
    logger.error({ userId: req.user.id, err: err.message }, "Update preferences failure");
    return res.status(500).json({ error: "Failed to update preferences." });
  }
});
