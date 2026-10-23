import { describe, it, expect } from "vitest";
import { detectClientPII } from "./piiMasker.js";

describe("Client-side PII Pre-flight Detection (DPDP Act 2023)", () => {
  it("detects valid 12-digit Indian Aadhaar numbers with spaces", () => {
    const text = "My Aadhaar is 2345 6789 0123 please verify";
    const warning = detectClientPII(text);
    expect(warning).toContain("Aadhaar number detected");
  });

  it("detects valid 12-digit Indian Aadhaar numbers without spaces", () => {
    const text = "Aadhaar: 345678901234";
    const warning = detectClientPII(text);
    expect(warning).toContain("Aadhaar number detected");
  });

  it("detects valid 10-character Indian PAN card numbers", () => {
    const text = "Here is my pan card ABCDE1234F for application";
    const warning = detectClientPII(text);
    expect(warning).toContain("PAN card number detected");
  });

  it("returns null when text is clean and contains no sensitive credentials", () => {
    const text = "I am a college student from Maharashtra looking for post matric scholarship.";
    const warning = detectClientPII(text);
    expect(warning).toBeNull();
  });

  it("handles empty or non-string inputs gracefully without throwing", () => {
    expect(detectClientPII("")).toBeNull();
    expect(detectClientPII(null)).toBeNull();
    expect(detectClientPII(undefined)).toBeNull();
    expect(detectClientPII(12345)).toBeNull();
  });
});
