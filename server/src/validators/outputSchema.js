import { z } from "zod";

export const outputSchema = z.object({
  summary: z.string(),
  serviceCategory: z.string(),
  likelyIntent: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  steps: z
    .array(z.object({ title: z.string(), detail: z.string() }))
    .max(8),
  documents: z
    .array(
      z.object({
        name: z.string(),
        reason: z.string(),
        requiredStatus: z.enum(["verify", "commonly-needed", "context-dependent"]),
      })
    )
    .max(10),
  questions: z.array(z.string()).max(5),
  officialSources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        why: z.string(),
      })
    )
    .max(5),
  cautions: z.array(z.string()).max(6),
  disclaimer: z.string(),
});
