import { getSupabase } from "../db/supabase.js";
import { logger } from "../logger.js";

/**
 * Save a completed AI response to the database.
 * Non-blocking: fails gracefully without interrupting user experience.
 */
export async function saveConversation({ userId, query, state, language, response }) {
  const supabase = getSupabase();
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: userId,
        query,
        state,
        language,
        response,
        service_category: response.serviceCategory,
      })
      .select("id")
      .single();

    if (error) throw error;
    logger.debug({ userId, conversationId: data.id }, "Conversation saved successfully");
    return data.id;
  } catch (err) {
    logger.warn({ userId, err: err.message }, "Failed to save conversation (non-fatal)");
    return null;
  }
}

/**
 * Retrieve a user's conversation history (recent items with metadata).
 */
export async function getUserConversations(userId, { limit = 20, offset = 0 } = {}) {
  const supabase = getSupabase();
  if (!supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, query, service_category, language, state, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (err) {
    logger.error({ userId, err: err.message }, "Failed to get user conversations");
    return [];
  }
}

/**
 * Retrieve a single conversation by ID with security check (must belong to user).
 */
export async function getConversationById(conversationId, userId) {
  const supabase = getSupabase();
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .single();

    if (error) return null;
    return data;
  } catch (err) {
    logger.error({ conversationId, userId, err: err.message }, "Failed to get conversation by id");
    return null;
  }
}
