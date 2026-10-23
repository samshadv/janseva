import crypto from "crypto";
import { getRedisClient } from "./rateLimitStore.js";
import { cacheHitsTotal, cacheMissesTotal } from "./metricsService.js";
import { logger } from "../logger.js";

const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours

function computeCacheKey(message, state = "All", language = "English") {
  const normalized = `${message.toLowerCase().trim()}|${state.trim()}|${language.trim()}`;
  const hash = crypto.createHash("sha256").update(normalized).digest("hex");
  return `jansetu:query:${hash}`;
}

/**
 * Retrieve cached AI response for repeated inquiries.
 */
export async function getCachedResponse(message, state, language) {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const key = computeCacheKey(message, state, language);
    const cached = await redis.get(key);

    if (cached) {
      cacheHitsTotal.inc();
      logger.debug({ key }, "Cache HIT: returning cached AI response");
      return JSON.parse(cached);
    }

    cacheMissesTotal.inc();
    return null;
  } catch (err) {
    logger.warn({ err: err.message }, "Redis cache lookup error — proceeding with live generation");
    return null;
  }
}

/**
 * Save verified AI plan to Redis with 6-hour TTL.
 */
export async function setCachedResponse(message, state, language, data) {
  const redis = getRedisClient();
  if (!redis || !data) return;

  try {
    const key = computeCacheKey(message, state, language);
    await redis.set(key, JSON.stringify(data), "EX", CACHE_TTL_SECONDS);
    logger.debug({ key, ttl: CACHE_TTL_SECONDS }, "Saved AI response to Redis cache");
  } catch (err) {
    logger.warn({ err: err.message }, "Failed to write to Redis cache (non-fatal)");
  }
}
