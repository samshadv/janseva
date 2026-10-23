import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { config } from "./config.js";
import { requestId } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { metricsMiddleware } from "./middleware/metrics.js";
import { getRedisClient } from "./services/rateLimitStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(__dirname, "../../client/dist");

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  // Advanced Security: Hardened Content Security Policy & Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://*.supabase.co", "https://*.googleapis.com"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // Response Compression: Gzip & Deflate
  app.use(compression());

  // CORS configuration with pre-flight caching (24 hours)
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origin === config.CLIENT_ORIGIN) {
          return callback(null, true);
        }
        return callback(new Error("Origin not allowed"));
      },
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "x-request-id", "Authorization"],
      maxAge: 86400,
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

  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
  }

  app.use(errorHandler);

  return app;
}
