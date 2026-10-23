import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { isOfficialGovDomain, sanitizeSources } from "../src/services/domainGuard.js";
import { matchCitizenEligibility } from "../src/services/eligibilityMatcher.js";
import { retrieveRelevantSchemes, formatSchemesForPrompt } from "../src/services/ragService.js";

describe("Phase 3 AI Quality & RAG Grounding", () => {
  const app = createApp();

  describe("Domain Guard & Link Whitelisting", () => {
    it("correctly identifies official government domains", () => {
      expect(isOfficialGovDomain("https://pmkisan.gov.in")).toBe(true);
      expect(isOfficialGovDomain("https://pmjay.gov.in/about")).toBe(true);
      expect(isOfficialGovDomain("https://mahadbt.maharashtra.gov.in")).toBe(true);
      expect(isOfficialGovDomain("https://scholarships.gov.in")).toBe(true);
      expect(isOfficialGovDomain("https://pmayg.nic.in")).toBe(true);
      expect(isOfficialGovDomain("https://voters.eci.gov.in")).toBe(true);
    });

    it("rejects non-government, phishing or suspicious domains", () => {
      expect(isOfficialGovDomain("https://pmkisan-scam.com")).toBe(false);
      expect(isOfficialGovDomain("https://free-scholarship.org")).toBe(false);
      expect(isOfficialGovDomain("http://randomsite.xyz/portal")).toBe(false);
      expect(isOfficialGovDomain("not-a-valid-url")).toBe(false);
    });

    it("sanitizes source lists and strips non-gov URLs", () => {
      const dirtySources = [
        { title: "Fake Portal", url: "https://fake-scheme.com", why: "Spam" },
        { title: "PM-KISAN Portal", url: "https://pmkisan.gov.in", why: "Apply online" },
      ];
      const cleaned = sanitizeSources(dirtySources);
      expect(cleaned).toHaveLength(1);
      expect(cleaned[0].url).toBe("https://pmkisan.gov.in");
      expect(cleaned[0].isGovVerified).toBe(true);
    });

    it("provides National Portal fallback if all sources were non-gov", () => {
      const emptyCleaned = sanitizeSources([]);
      expect(emptyCleaned).toHaveLength(1);
      expect(emptyCleaned[0].url).toBe("https://www.india.gov.in");
    });
  });

  describe("RAG Retrieval & Prompt Grounding", () => {
    it("retrieves relevant official schemes based on query keywords", async () => {
      const schemes = await retrieveRelevantSchemes("I am a farmer and need annual income support", "All");
      expect(schemes.length).toBeGreaterThan(0);
      const kisanScheme = schemes.find((s) => s.code === "PM_KISAN");
      expect(kisanScheme).toBeDefined();
    });

    it("formats schemes into clean reference context block", () => {
      const mockSchemes = [
        {
          code: "TEST_SCHEME",
          title: "Test Public Scheme",
          ministry_or_dept: "Ministry of Test",
          category: "Welfare",
          official_portal: "https://test.gov.in",
          required_documents: ["Aadhaar"],
          application_steps: ["Visit website", "Submit form"],
        },
      ];
      const formatted = formatSchemesForPrompt(mockSchemes);
      expect(formatted).toContain("VERIFIED GOVERNMENT SCHEME REFERENCE DATA");
      expect(formatted).toContain("Test Public Scheme");
      expect(formatted).toContain("https://test.gov.in");
    });
  });

  describe("Eligibility Matching Engine", () => {
    it("matches farmer scheme for farmer occupation", () => {
      const matches = matchCitizenEligibility({
        state: "Maharashtra",
        age: 35,
        occupation: "Farmer",
        incomeBracket: "UPTO_5L",
      });
      const topMatch = matches.find((m) => m.code === "PM_KISAN");
      expect(topMatch).toBeDefined();
      expect(topMatch.matchPercentage).toBeGreaterThanOrEqual(75);
    });

    it("matches voter registration for adult citizen", () => {
      const matches = matchCitizenEligibility({
        state: "Delhi",
        age: 19,
        occupation: "Student",
        incomeBracket: "UPTO_2_5L",
      });
      const voterMatch = matches.find((m) => m.code === "VOTER_ID_REGISTRATION");
      expect(voterMatch).toBeDefined();
    });
  });

  describe("Schemes API Endpoints", () => {
    it("GET /api/schemes returns official schemes catalog", async () => {
      const res = await request(app).get("/api/schemes");
      expect(res.status).toBe(200);
      expect(res.body.schemes).toBeInstanceOf(Array);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it("GET /api/schemes with category filter", async () => {
      const res = await request(app).get("/api/schemes?category=Agriculture");
      expect(res.status).toBe(200);
      expect(res.body.schemes.every((s) => s.category === "Agriculture")).toBe(true);
    });

    it("POST /api/schemes/match returns scored matches", async () => {
      const res = await request(app)
        .post("/api/schemes/match")
        .send({
          state: "Maharashtra",
          age: 21,
          occupation: "Student",
          incomeBracket: "UPTO_2_5L",
        });
      expect(res.status).toBe(200);
      expect(res.body.matches).toBeInstanceOf(Array);
      expect(res.body.totalMatches).toBeGreaterThan(0);
    });
  });
});
