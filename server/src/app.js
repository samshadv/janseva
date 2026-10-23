import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { config } from "./config.js";
import { requestId } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";
import { metricsMiddleware } from "./middleware/metrics.js";
import { getRedisClient } from "./services/rateLimitStore.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());

  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser requests such as health checks or local scripts; browser origins must match allowlist.
        if (!origin || origin === config.CLIENT_ORIGIN) {
          return callback(null, true);
        }
        return callback(new Error("Origin not allowed"));
      },
      methods: ["GET", "POST", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "x-request-id", "Authorization"],
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(requestId);
  app.use(requestLogger);
  app.use(metricsMiddleware);

  const redis = getRedisClient();

  // Rate limiting for /api/ routes (20 requests per minute in production/dev, higher in test)
  app.use(
    "/api/",
    rateLimit({
      windowMs: 60_000,
      limit: config.NODE_ENV === "test" ? 1000 : 20,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { error: "Too many requests. Please wait a minute and try again." },
      ...(redis && {
        store: new RedisStore({
          sendCommand: (...args) => redis.call(...args),
        }),
      }),
    })
  );

  app.use("/api", apiRouter);

  app.use(errorHandler);

  return app;
}
