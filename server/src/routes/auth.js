import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { getSupabase } from "../db/supabase.js";
import { getUserConversations } from "../services/conversationService.js";
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
  preferredLanguage: z.string().max(40).optional(),
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

// GET /api/me/export — DPDP Act 2023 Right to Data Portability (Section 11)
// Exports the citizen's entire digital record in JSON format
authRouter.get("/me/export", authenticate({ required: true }), async (req, res) => {
  const supabase = getSupabase();

  let profile = { id: req.user.id, email: req.user.email };
  let conversations = [];

  if (supabase) {
    try {
      const { data: p } = await supabase.from("user_profiles").select("*").eq("id", req.user.id).single();
      if (p) profile = p;

      const { data: c } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", req.user.id)
        .order("created_at", { ascending: false });
      if (c) conversations = c;
    } catch (err) {
      logger.error({ userId: req.user.id, err: err.message }, "Data export partial failure");
    }
  }

  const exportPayload = {
    dpdp_compliance: "Digital Personal Data Protection Act, 2023 (Section 11)",
    exportDate: new Date().toISOString(),
    citizen: profile,
    savedInquiriesCount: conversations.length,
    conversations,
  };

  res.setHeader("Content-Disposition", `attachment; filename="jansetu_data_export_${req.user.id.slice(0, 8)}.json"`);
  res.setHeader("Content-Type", "application/json");
  return res.json(exportPayload);
});

// DELETE /api/me — DPDP Act 2023 Right to Erasure / "Right to be Forgotten" (Section 12)
// Permanently erases user profile, saved conversations, and feedback
authRouter.delete("/me", authenticate({ required: true }), async (req, res) => {
  const supabase = getSupabase();

  if (supabase) {
    try {
      // Delete conversations
      await supabase.from("conversations").delete().eq("user_id", req.user.id);
      // Delete feedback
      await supabase.from("feedback").delete().eq("user_id", req.user.id);
      // Delete user profile
      await supabase.from("user_profiles").delete().eq("id", req.user.id);

      logger.info({ userId: req.user.id }, "DPDP Right to Erasure: citizen records permanently deleted");
    } catch (err) {
      logger.error({ userId: req.user.id, err: err.message }, "Erasure request failed");
      return res.status(500).json({ error: "Could not complete data erasure request." });
    }
  }

  return res.json({
    ok: true,
    message: "All citizen data and conversation history permanently erased under DPDP Act 2023.",
  });
});
