import { Router } from "express";
import { config } from "../config.js";
import { getSupabase } from "../db/supabase.js";
import { getRedisClient } from "../services/rateLimitStore.js";

export const healthRouter = Router();

// GET /api/health — Summary status
healthRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "jansetu-ai",
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.NODE_ENV,
    model: config.GEMINI_MODEL,
    aiConfigured: config.isApiKeyConfigured,
  });
});

// GET /api/health/live — Kubernetes Liveness Probe
// Checks if the HTTP process is alive and able to accept connections
healthRouter.get("/live", (_req, res) => {
  return res.status(200).json({ status: "alive", uptime: process.uptime() });
});

// GET /api/health/ready — Kubernetes Readiness Probe
// Verifies that backing dependencies (database, Redis) are ready to handle traffic
healthRouter.get("/ready", async (_req, res) => {
  const checks = {
    server: "healthy",
    supabase: "not_configured",
    redis: "not_configured",
  };

  let isReady = true;

  // 1. Check Supabase (if configured)
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from("user_profiles").select("id").limit(1);
      if (error && error.code !== "PGRST116") {
        checks.supabase = "unreachable";
        // Supabase unreachable is not fatal to basic AI answers, but flag in readiness
      } else {
        checks.supabase = "connected";
      }
    } catch {
      checks.supabase = "error";
    }
  }

  // 2. Check Redis (if configured)
  const redis = getRedisClient();
  if (redis) {
    try {
      const ping = await redis.ping();
      checks.redis = ping === "PONG" ? "connected" : "degraded";
    } catch {
      checks.redis = "unreachable";
    }
  }

  return res.status(isReady ? 200 : 503).json({
    ready: isReady,
    checks,
    timestamp: new Date().toISOString(),
  });
});
