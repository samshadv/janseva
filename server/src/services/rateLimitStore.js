import Redis from "ioredis";
import { config } from "../config.js";
import { logger } from "../logger.js";

let _redis = null;

export function getRedisClient() {
  if (_redis) return _redis;
  if (!config.REDIS_URL) {
    logger.info("No REDIS_URL configured — using standard memory rate limiter");
    return null;
  }

  try {
    _redis = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    _redis.on("error", (err) => {
      logger.error({ err: err.message }, "Redis connection error");
    });

    _redis.on("connect", () => {
      logger.info("Redis connected for distributed rate limiting");
    });

    return _redis;
  } catch (err) {
    logger.error({ err: err.message }, "Failed to initialize Redis client");
    return null;
  }
}
