import { describe, it, expect } from "vitest";
import { inputSchema } from "../src/validators/inputSchema.js";
import { outputSchema } from "../src/validators/outputSchema.js";

describe("inputSchema", () => {
  it("accepts a valid request", () => {
    const valid = {
      message: "I am a college student. How can I apply for post-matric scholarships?",
      state: "Maharashtra",
      language: "English",
    };
    const result = inputSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.state).toBe("Maharashtra");
      expect(result.data.language).toBe("English");
    }
  });

  it("defaults state and language when omitted", () => {
    const minimal = {
      message: "How do I update the address on my voter identity card?",
    };
    const result = inputSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.state).toBe("Not specified");
      expect(result.data.language).toBe("English");
    }
  });

  it("rejects messages shorter than 8 characters", () => {
    const invalid = { message: "help me" };
    const result = inputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Please describe what you need");
    }
  });

  it("rejects unsupported languages", () => {
    const invalid = {
      message: "How can I register a birth certificate?",
      language: "Spanish",
    };
    const result = inputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("outputSchema", () => {
  it("validates a compliant model payload", () => {
    const samplePayload = {
      summary: "Overview of student scholarships",
      serviceCategory: "Education & Scholarships",
      likelyIntent: "Apply for post-matric scholarship",
      confidence: "high",
      steps: [
        { title: "Register on NSP portal", detail: "Create an account using Aadhaar details" },
      ],
      documents: [
        { name: "Income Certificate", reason: "Proof of eligibility", requiredStatus: "commonly-needed" },
      ],
      questions: ["Which academic year are you applying for?"],
      officialSources: [
        { title: "National Scholarship Portal", url: "https://scholarships.gov.in", why: "Official portal" },
      ],
      cautions: ["Never pay money to agents claiming guaranteed scholarship grants."],
      disclaimer: "Confirm deadlines and requirements directly on the portal.",
    };

    const result = outputSchema.safeParse(samplePayload);
    expect(result.success).toBe(true);
  });

  it("fails if required fields are missing", () => {
    const incomplete = {
      summary: "Incomplete payload",
    };
    const result = outputSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });
});
