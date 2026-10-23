import { z } from "zod";

export const inputSchema = z.object({
  message: z
    .string()
    .trim()
    .min(8, "Please describe what you need in a little more detail.")
    .max(6000),
  state: z.string().trim().max(80).optional().default("Not specified"),
  language: z.enum(["English", "Hindi", "Marathi"]).default("English"),
});
