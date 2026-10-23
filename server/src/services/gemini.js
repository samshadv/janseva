import { GoogleGenAI } from "@google/genai";
import { config } from "../config.js";
import { outputSchema } from "../validators/outputSchema.js";
import { retrieveRelevantSchemes, formatSchemesForPrompt } from "./ragService.js";
import { sanitizeSources } from "./domainGuard.js";
import { logger } from "../logger.js";

const systemInstruction = `
You are JanSetu AI, an expert, careful public-services navigator for India.
Help citizens understand government schemes, public services, procedures, and preparation checklists in clear, plain language.

STRICT GROUNDING & ANTI-HALLUCINATION RULES:
1. When official verified scheme reference data is provided below, treat it as ground truth for portals, required documents, and process steps.
2. OfficialSources MUST ONLY contain verified Indian government domains (ending in .gov.in, .nic.in, or verified official portals provided in the reference data).
3. NEVER invent or guess portal URLs, phone numbers, application fees, or unverified cutoffs. If unsure of an official portal, specify "https://www.india.gov.in" and advise the user how to search safely.
4. Never request Aadhaar numbers, PAN, bank credentials, OTPs, passwords, or full document images. Explicitly remind citizens never to share these.
5. Do not make definitive legal, financial, or benefits determinations. Explain eligibility conditions clearly and suggest verification questions.
6. Provide structured, step-by-step guidance formatted strictly in the requested language (e.g. Hindi, Marathi, Bengali, Telugu, Tamil, Gujarati, Kannada, Punjabi, English).
7. Return only JSON matching the requested schema.
`;

const responseSchema = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    serviceCategory: { type: "STRING" },
    likelyIntent: { type: "STRING" },
    confidence: { type: "STRING", enum: ["low", "medium", "high"] },
    steps: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          detail: { type: "STRING" },
        },
        required: ["title", "detail"],
      },
    },
    documents: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          reason: { type: "STRING" },
          requiredStatus: {
            type: "STRING",
            enum: ["verify", "commonly-needed", "context-dependent"],
          },
        },
        required: ["name", "reason", "requiredStatus"],
      },
    },
    questions: { type: "ARRAY", items: { type: "STRING" } },
    officialSources: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          url: { type: "STRING" },
          why: { type: "STRING" },
        },
        required: ["title", "url", "why"],
      },
    },
    cautions: { type: "ARRAY", items: { type: "STRING" } },
    disclaimer: { type: "STRING" },
  },
  required: [
    "summary",
    "serviceCategory",
    "likelyIntent",
    "confidence",
    "steps",
    "documents",
    "questions",
    "officialSources",
    "cautions",
    "disclaimer",
  ],
};

export async function getAssistance({ message, state, language }, requestId) {
  logger.debug({ requestId, state, language }, "Initiating grounded Gemini request");

  // Step 1: Retrieve grounded scheme context (RAG)
  const matchedSchemes = await retrieveRelevantSchemes(message, state);
  const ragContext = formatSchemesForPrompt(matchedSchemes);

  const promptContent = `
Citizen location/state: ${state}
Requested language: ${language}
${ragContext}
Citizen Inquiry:
${message}
`;

  const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  const result = await ai.models.generateContent({
    model: config.GEMINI_MODEL,
    contents: promptContent,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.15,
    },
  });

  const raw = result.text;
  if (!raw) {
    throw new Error("Empty model response");
  }

  const decoded = outputSchema.safeParse(JSON.parse(raw));
  if (!decoded.success) {
    logger.error({ requestId, issues: decoded.error.issues }, "Model output schema validation failed");
    throw new Error("Model returned an unexpected response format");
  }

  // Step 2: Sanitize URLs through Domain Guard
  const verifiedSources = sanitizeSources(decoded.data.officialSources);

  return {
    ...decoded.data,
    officialSources: verifiedSources,
    groundedSchemes: matchedSchemes.map((s) => ({
      code: s.code,
      title: s.title,
      category: s.category,
      portal: s.official_portal,
    })),
    disclaimer:
      decoded.data.disclaimer ||
      "JanSetu AI guidance is designed for public navigation. Confirm current requirements on the official government portals listed above.",
  };
}
