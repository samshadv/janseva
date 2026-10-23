import { logger } from "../logger.js";

export function errorHandler(err, req, res, _next) {
  if (err?.message === "Origin not allowed") {
    return res.status(403).json({ error: "This origin is not allowed." });
  }

  logger.error(
    {
      requestId: req.id,
      error: err?.message || "unknown",
      stack: err?.stack,
    },
    "Unhandled server error"
  );

  return res.status(500).json({ error: "Unexpected server error." });
}
