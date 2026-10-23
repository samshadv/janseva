import { Router } from "express";
import { z } from "zod";
import officialSchemes from "../db/seeds/officialSchemes.json" with { type: "json" };
import { matchCitizenEligibility } from "../services/eligibilityMatcher.js";

export const schemesRouter = Router();

// GET /api/schemes — List official schemes with optional category/state filters
schemesRouter.get("/", (req, res) => {
  const { category, state } = req.query;

  let filtered = officialSchemes;

  if (category && typeof category === "string") {
    filtered = filtered.filter(
      (s) => s.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (state && typeof state === "string" && state !== "All") {
    filtered = filtered.filter(
      (s) => s.applicable_states.includes("All") || s.applicable_states.includes(state)
    );
  }

  return res.json({
    schemes: filtered,
    total: filtered.length,
  });
});

// POST /api/schemes/match — Match citizen questionnaire answers with verified schemes
const matchSchema = z.object({
  state: z.string().trim().optional().default("All"),
  age: z.coerce.number().min(0).max(120).optional(),
  occupation: z.string().trim().optional().default("Any"),
  incomeBracket: z
    .enum(["BELOW_1L", "UPTO_2_5L", "UPTO_5L", "UPTO_8L", "ABOVE_8L"])
    .optional()
    .default("UPTO_5L"),
});

schemesRouter.post("/match", (req, res) => {
  const parsed = matchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message || "Invalid match parameters.",
    });
  }

  const matched = matchCitizenEligibility(parsed.data);
  return res.json({
    matches: matched,
    totalMatches: matched.length,
  });
});
