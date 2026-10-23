import { z } from "zod";

export const SUPPORTED_LANGUAGES = [
  "English",
  "Hindi",
  "Marathi",
  "Bengali",
  "Telugu",
  "Tamil",
  "Gujarati",
  "Kannada",
  "Punjabi",
  "Malayalam",
  "Odia",
  "Urdu",
];

export const inputSchema = z.object({
  message: z
    .string()
    .trim()
    .min(8, "Please describe what you need in a little more detail.")
    .max(6000),
  state: z.string().trim().max(80).optional().default("Not specified"),
  language: z.enum(SUPPORTED_LANGUAGES).default("English"),
});
