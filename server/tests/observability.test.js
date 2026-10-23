import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("Phase 4 Observability & Health Probes", () => {
  const app = createApp();

  describe("Kubernetes Probes", () => {
    it("GET /api/health/live returns 200 alive status", async () => {
      const res = await request(app).get("/api/health/live");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("alive");
      expect(typeof res.body.uptime).toBe("number");
    });

    it("GET /api/health/ready returns 200 with dependency checks", async () => {
      const res = await request(app).get("/api/health/ready");
      expect(res.status).toBe(200);
      expect(res.body.ready).toBe(true);
      expect(res.body.checks).toBeDefined();
      expect(res.body.checks.server).toBe("healthy");
    });

    it("GET /api/health includes service uptime and environment", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Prometheus Metrics Endpoint", () => {
    it("GET /api/metrics exports Prometheus text format", async () => {
      // Make a dummy request first to trigger metric collection
      await request(app).get("/api/health");

      const res = await request(app).get("/api/metrics");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/plain/i);

      // Verify custom JanSetu metrics exist
      expect(res.text).toContain("jansetu_http_request_duration_seconds");
      expect(res.text).toContain("jansetu_http_requests_total");
      expect(res.text).toContain("jansetu_active_requests");
    });
  });
});
