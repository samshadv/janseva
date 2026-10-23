import { Router } from "express";
import { config } from "../config.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "jansetu-ai",
    environment: config.NODE_ENV,
    model: config.GEMINI_MODEL,
    aiConfigured: config.isApiKeyConfigured,
  });
});
