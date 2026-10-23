import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getUserConversations, getConversationById } from "../services/conversationService.js";

export const conversationsRouter = Router();

// GET /api/conversations — paginated list of user's past queries
conversationsRouter.get("/", authenticate({ required: true }), async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 20), 50);
  const offset = Math.max(Number(req.query.offset || 0), 0);

  const conversations = await getUserConversations(req.user.id, { limit, offset });
  return res.json({ conversations, total: conversations.length });
});

// GET /api/conversations/:id — retrieve specific full conversation
conversationsRouter.get("/:id", authenticate({ required: true }), async (req, res) => {
  const conversation = await getConversationById(req.params.id, req.user.id);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found." });
  }
  return res.json(conversation);
});
