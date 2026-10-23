import { Router } from "express";
import { config } from "../config.js";
import { inputSchema } from "../validators/inputSchema.js";
import { getAssistance } from "../services/gemini.js";
import { authenticate } from "../middleware/authenticate.js";
import { saveConversation } from "../services/conversationService.js";
import { logger } from "../logger.js";

export const assistRouter = Router();

assistRouter.post("/", authenticate({ required: false }), async (req, res, next) => {
  const parsed = inputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message || "Invalid request.",
    });
  }

  if (!config.isApiKeyConfigured) {
    return res.status(503).json({
      error: "AI service is not configured. Add GEMINI_API_KEY to server/.env.",
    });
  }

  try {
    const data = await getAssistance(parsed.data, req.id);

    // If user is authenticated, persist conversation asynchronously
    let conversationId = null;
    if (req.user) {
      saveConversation({
        userId: req.user.id,
        query: parsed.data.message,
        state: parsed.data.state,
        language: parsed.data.language,
        response: data,
      }).catch((err) => {
        logger.warn({ err: err.message }, "Background conversation save failed");
      });
    }

    res.set("Cache-Control", "no-store");
    return res.json({
      ...data,
      conversationId,
      isAuthenticated: Boolean(req.user),
    });
  } catch (error) {
    logger.error(
      {
        requestId: req.id,
        err: error?.message || "unknown",
      },
      "assist_error"
    );

    return res.status(502).json({
      error:
        "JanSetu could not prepare guidance right now. Please retry, or consult the relevant official government portal.",
    });
  }
});
