import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock the gemini service before importing the app
vi.mock("../src/services/gemini.js", () => ({
  getAssistance: vi.fn(),
}));

// Mock config module to test both configured and unconfigured states
vi.mock("../src/config.js", () => ({
  config: {
    PORT: 5001,
    NODE_ENV: "test",
    GEMINI_API_KEY: "mock-valid-key",
    GEMINI_MODEL: "gemini-3.5-flash",
    CLIENT_ORIGIN: "http://localhost:5173",
    isApiKeyConfigured: true,
  },
}));

import { createApp } from "../src/app.js";
import { getAssistance } from "../src/services/gemini.js";
import { config } from "../src/config.js";

const app = createApp();

describe("POST /api/assist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    config.isApiKeyConfigured = true;
  });

  it("returns 400 when message is too short", async () => {
    const res = await request(app)
      .post("/api/assist")
      .send({ message: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Please describe what you need");
  });

  it("returns 400 for unsupported language", async () => {
    const res = await request(app)
      .post("/api/assist")
      .send({
        message: "How can I apply for an income certificate in Pune?",
        language: "German",
      });

    expect(res.status).toBe(400);
  });

  it("returns 503 when AI service is not configured", async () => {
    config.isApiKeyConfigured = false;

    const res = await request(app)
      .post("/api/assist")
      .send({
        message: "How can I apply for an income certificate in Pune?",
        state: "Maharashtra",
        language: "English",
      });

    expect(res.status).toBe(503);
    expect(res.body.error).toContain("AI service is not configured");
  });

  it("returns 200 and structured action plan on success", async () => {
    const mockPlan = {
      summary: "Apply via Aaple Sarkar portal",
      serviceCategory: "Revenue & Certificates",
      likelyIntent: "Obtain income certificate",
      confidence: "high",
      steps: [
        { title: "Register on Aaple Sarkar", detail: "Create an account on aaplesarkar.mahaonline.gov.in" },
      ],
      documents: [
        { name: "Salary Slip / Form 16", reason: "Proof of income", requiredStatus: "commonly-needed" },
      ],
      questions: ["Is this for educational concession?"],
      officialSources: [
        { title: "Aaple Sarkar Portal", url: "https://aaplesarkar.mahaonline.gov.in", why: "Official portal" },
      ],
      cautions: ["Do not pay unofficial agents."],
      disclaimer: "Verify with local Tehsildar office.",
    };

    getAssistance.mockResolvedValueOnce(mockPlan);

    const res = await request(app)
      .post("/api/assist")
      .send({
        message: "How can I apply for an income certificate in Pune?",
        state: "Maharashtra",
        language: "English",
      });

    expect(res.status).toBe(200);
    expect(res.body.summary).toBe(mockPlan.summary);
    expect(res.body.steps).toHaveLength(1);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.headers["x-request-id"]).toBeDefined();
  });

  it("returns 502 with friendly message when AI provider fails", async () => {
    getAssistance.mockRejectedValueOnce(new Error("Gemini API rate limit exceeded"));

    const res = await request(app)
      .post("/api/assist")
      .send({
        message: "How can I apply for an income certificate in Pune?",
        state: "Maharashtra",
        language: "English",
      });

    expect(res.status).toBe(502);
    expect(res.body.error).toContain("could not prepare guidance right now");
  });
});
