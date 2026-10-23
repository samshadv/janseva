import { redactPII, containsSensitivePII } from "../services/piiService.js";
import { logger } from "../logger.js";

/**
 * Middleware that scans and redacts sensitive citizen PII from the request payload.
 */
export function piiRedactorMiddleware(req, res, next) {
  if (req.body && typeof req.body.message === "string") {
    if (containsSensitivePII(req.body.message)) {
      const originalLength = req.body.message.length;
      req.body.message = redactPII(req.body.message);
      req.piiRedacted = true;

      logger.info(
        {
          requestId: req.id,
          originalLength,
          redactedLength: req.body.message.length,
        },
        "Sensitive citizen PII redacted from inquiry"
      );
    }
  }
  next();
}
