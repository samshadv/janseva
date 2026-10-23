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

// Helper to sanitize malicious HTML tags and scripts
function sanitizePrompt(val) {
  if (typeof val !== "string") return "";
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/javascript:[^\s"']+/gi, "")
    .trim();
}

export const inputSchema = z.object({
  message: z
    .string()
    .trim()
    .min(8, "Please describe what you need in a little more detail.")
    .max(6000)
    .transform(sanitizePrompt),
  state: z.string().trim().max(80).optional().default("Not specified"),
  language: z.enum(SUPPORTED_LANGUAGES).default("English"),
});
