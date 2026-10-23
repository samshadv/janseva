import { logger } from "../logger.js";

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: duration,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, "Request failed with server error");
    } else if (res.statusCode >= 400) {
      logger.warn(logData, "Request completed with client error");
    } else {
      logger.info(logData, "Request completed successfully");
    }
  });

  next();
}
