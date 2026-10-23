import { describe, it, expect } from "vitest";
import { SUPPORTED_LANGUAGES } from "./languages.js";

describe("Supported Languages & Multilingual Accessibility", () => {
  it("contains required major Indian languages", () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain("English");
    expect(codes).toContain("Hindi");
    expect(codes).toContain("Marathi");
    expect(codes).toContain("Tamil");
    expect(codes).toContain("Telugu");
  });

  it("every language entry has name and nativeName for screen readers", () => {
    SUPPORTED_LANGUAGES.forEach((lang) => {
      expect(lang).toHaveProperty("code");
      expect(lang).toHaveProperty("name");
      expect(lang).toHaveProperty("nativeName");
      expect(lang.code.length).toBeGreaterThan(0);
      expect(lang.name.length).toBeGreaterThan(0);
      expect(lang.nativeName.length).toBeGreaterThan(0);
    });
  });
});
