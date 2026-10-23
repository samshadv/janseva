import { Router } from "express";
import { register } from "../services/metricsService.js";

export const metricsRouter = Router();

// GET /api/metrics — Prometheus scrape endpoint
metricsRouter.get("/", async (req, res) => {
  try {
    res.setHeader("Content-Type", register.contentType);
    const metricsData = await register.metrics();
    return res.send(metricsData);
  } catch (err) {
    return res.status(500).send("Error collecting metrics");
  }
});
