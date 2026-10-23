import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(5001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  GEMINI_API_KEY: z.string().optional().default(""),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  SUPABASE_URL: z.string().url().or(z.literal("")).optional().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
  SUPABASE_ANON_KEY: z.string().optional().default(""),
  REDIS_URL: z.string().optional().default(""),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === "production") {
    if (!data.GEMINI_API_KEY || data.GEMINI_API_KEY === "replace_with_your_key") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GEMINI_API_KEY"],
        message: "GEMINI_API_KEY must be a valid key in production environment",
      });
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables configuration:");
  console.error(parsed.error.format());
  process.exit(1);
}

export const config = {
  ...parsed.data,
  isApiKeyConfigured: Boolean(parsed.data.GEMINI_API_KEY && parsed.data.GEMINI_API_KEY !== "replace_with_your_key"),
};
