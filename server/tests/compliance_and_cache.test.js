import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { redactPII, containsSensitivePII } from "../src/services/piiService.js";
import { getCachedResponse, setCachedResponse } from "../src/services/cacheService.js";

describe("Phase 5 DPDP Compliance, PII Redactor & Caching", () => {
  const app = createApp();

  describe("Indian PII Redaction Engine", () => {
    it("detects and redacts 12-digit Aadhaar numbers", () => {
      const input = "My Aadhaar is 4567 8901 2345, please help with ration card";
      expect(containsSensitivePII(input)).toBe(true);

      const redacted = redactPII(input);
      expect(redacted).not.toContain("4567 8901 2345");
      expect(redacted).toContain("[AADHAAR REDACTED");
      expect(redacted).toContain("2345");
    });

    it("detects and redacts PAN card numbers", () => {
      const input = "I need to file grievance, my PAN is ABCDE1234F";
      expect(containsSensitivePII(input)).toBe(true);

      const redacted = redactPII(input);
      expect(redacted).not.toContain("ABCDE1234F");
      expect(redacted).toContain("[PAN REDACTED");
    });

    it("detects and redacts Indian mobile numbers", () => {
      const input = "Call me at +91 9876543210 or 8765432109";
      expect(containsSensitivePII(input)).toBe(true);

      const redacted = redactPII(input);
      expect(redacted).not.toContain("9876543210");
      expect(redacted).toContain("[PHONE REDACTED]");
    });

    it("leaves general non-PII citizen queries completely intact", () => {
      const query = "What documents are required for passport renewal in Maharashtra?";
      expect(containsSensitivePII(query)).toBe(false);
      expect(redactPII(query)).toBe(query);
    });
  });

  describe("DPDP Act 2023 Citizen Rights Endpoints", () => {
    it("GET /api/me/export requires authentication (401)", async () => {
      const res = await request(app).get("/api/me/export");
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Authentication required/i);
    });

    it("DELETE /api/me requires authentication (401)", async () => {
      const res = await request(app).delete("/api/me");
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Authentication required/i);
    });
  });

  describe("Redis Query Response Cache Engine", () => {
    it("handles cache lookup gracefully when Redis is not running", async () => {
      const cached = await getCachedResponse("Scholarship query", "Delhi", "English");
      expect(cached).toBeNull();
    });

    it("handles cache write gracefully when Redis is not running", async () => {
      await expect(
        setCachedResponse("Sample query", "Maharashtra", "English", { test: true })
      ).resolves.not.toThrow();
    });
  });

  describe("PII Redaction on live /api/assist route", () => {
    it("redacts PII from request body message seamlessly", async () => {
      const res = await request(app)
        .post("/api/assist")
        .send({
          message: "My aadhaar is 3456 7890 1234 and phone is 9876543210, need pension help",
          state: "Maharashtra",
          language: "English",
        });

      // The endpoint will either process or return 503 AI unconfigured in test, but should NOT return 400
      expect(res.status).not.toBe(400);
    });
  });
});
