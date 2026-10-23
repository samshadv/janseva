import { describe, it, expect, vi } from "vitest";
import request from "supertest";

vi.mock("../src/services/gemini.js", () => ({
  getAssistance: vi.fn().mockResolvedValue({
    summary: "Mock summary",
    serviceCategory: "General",
    likelyIntent: "Farmer Insurance",
    confidence: "high",
    steps: [{ title: "Step 1", detail: "Detail" }],
    documents: [],
    questions: [],
    officialSources: [],
    cautions: [],
    disclaimer: "Mock disclaimer",
    groundedSchemes: [],
  }),
}));

import { createApp } from "../src/app.js";

describe("Phase 2 Authentication & Protected Routes", () => {
  const app = createApp();

  it("GET /api/me without token returns 401 Unauthorized", async () => {
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Authentication required/i);
  });

  it("GET /api/conversations without token returns 401 Unauthorized", async () => {
    const res = await request(app).get("/api/conversations");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Authentication required/i);
  });

  it("PATCH /api/me/preferences without token returns 401 Unauthorized", async () => {
    const res = await request(app)
      .patch("/api/me/preferences")
      .send({ preferredLanguage: "Hindi" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Authentication required/i);
  });

  it("POST /api/assist works without token (anonymous access preserved)", async () => {
    const res = await request(app)
      .post("/api/assist")
      .send({
        message: "How to apply for farmer insurance?",
        state: "Maharashtra",
        language: "English",
      });

    // In test environment without valid API key, returns 503 AI service not configured or 200
    // It should NEVER return 401 because assist is public/optional-auth
    expect(res.status).not.toBe(401);
  });
});
