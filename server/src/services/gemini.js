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

function withTimeout(promise, ms) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Model call timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

function generateSchemeGroundedFallback({ message, state, language, matchedSchemes }) {
  const topSchemes = (matchedSchemes && matchedSchemes.length > 0) ? matchedSchemes.slice(0, 2) : [];
  const primary = topSchemes[0] || {
    code: "GENERAL_GUIDANCE",
    title: "National Government Services Portal",
    category: "Public Services",
    summary: "Citizen services and departmental guidelines across central and state governments.",
    official_portal: "https://www.india.gov.in",
    required_documents: ["Aadhaar Card", "Active Mobile Number", "Identity Proof", "Address Proof"],
    application_steps: [
      "Visit the official portal or your local Common Service Centre (CSC) / Citizen Seva Kendra.",
      "Verify your eligibility criteria and active scheme guidelines for your state.",
      "Gather your attested preparation documents before initiating online registration.",
      "Submit your application and track your acknowledgment slip or reference number."
    ]
  };

  // Aggregate application steps across top matching schemes
  const allSteps = [];
  topSchemes.forEach((s) => {
    if (s.application_steps) {
      s.application_steps.forEach((step) => {
        if (!allSteps.includes(step)) allSteps.push(step);
      });
    }
  });

  const steps = (allSteps.length > 0 ? allSteps : primary.application_steps).slice(0, 6).map((step, idx) => ({
    title: `Step ${idx + 1}: ${step.split(/[:\.]/)[0] || "Action"}`,
    detail: step
  }));

  // Aggregate documents across top matching schemes
  const allDocs = [];
  topSchemes.forEach((s) => {
    if (s.required_documents) {
      s.required_documents.forEach((doc) => {
        if (!allDocs.includes(doc)) allDocs.push(doc);
      });
    }
  });

  const documents = (allDocs.length > 0 ? allDocs : primary.required_documents).slice(0, 6).map((doc) => ({
    name: doc,
    reason: `Required by department to verify eligibility and process application for ${primary.title}.`,
    requiredStatus: "commonly-needed"
  }));

  // Aggregate official source portals
  const officialSources = topSchemes.map((s) => ({
    title: s.title,
    url: s.official_portal || "https://www.india.gov.in",
    why: `Official government portal for ${s.title} registration, eligibility criteria, and tracking.`
  }));

  if (officialSources.length === 0) {
    officialSources.push({
      title: "National Government Services Portal",
      url: "https://www.india.gov.in",
      why: "Central directory for verified Indian public services and state portals."
    });
  }

  const categoryTitle = topSchemes.length > 1
    ? `${topSchemes[0].title} & ${topSchemes[1].title}`
    : primary.title;

  return {
    summary: `Verified guidance prepared for ${primary.category || "Public Services"} in ${state}. Follow these official procedures and document checklists for ${categoryTitle}.`,
    serviceCategory: primary.category || "Public Services",
    likelyIntent: `Assistance with ${categoryTitle} in ${state}`,
    confidence: "high",
    steps,
    documents,
    questions: [
      `Do you reside in a rural area (Gram Panchayat) or urban municipality?`,
      `Does your family annual income fall under EWS (below ₹3L), LIG (₹3-6L), or MIG (₹6-18L)?`,
      `Do you or any immediate family member currently own a pucca house in India?`
    ],
    officialSources,
    cautions: [
      "Government scheme registrations on official portals are completely free. Never pay money to unauthorized agents.",
      "Never disclose sensitive details such as Aadhaar OTPs, bank passwords, or PINs to anyone.",
      "Ensure all family members' names on Aadhaar cards match property and income certificates exactly."
    ],
    disclaimer: "Guidance is compiled from verified government registries. Confirm current dates, income cutoffs, and submission guidelines directly on the official portal."
  };
}

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

  const CANDIDATE_MODELS = [
    config.GEMINI_MODEL,
    "gemini-3.8-flash",
    "gemini-3.5-flash"
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

  let raw = null;
  let lastError = null;

  if (config.GEMINI_API_KEY && config.isApiKeyConfigured) {
    const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

    for (const modelName of CANDIDATE_MODELS) {
      try {
        logger.debug({ requestId, model: modelName }, "Calling Gemini API with 5s timeout");
        const result = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: promptContent,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema,
              temperature: 0.15,
            },
          }),
          5000
        );

        if (result.text) {
          raw = result.text;
          logger.info({ requestId, model: modelName }, "Gemini API responded successfully");
          break;
        }
      } catch (err) {
        lastError = err;
        logger.warn(
          { requestId, model: modelName, err: err.message },
          "Model call failed or timed out; evaluating next option"
        );
      }
    }
  }

  let finalPlan = null;

  if (raw) {
    try {
      const decoded = outputSchema.safeParse(JSON.parse(raw));
      if (decoded.success) {
        finalPlan = decoded.data;
      } else {
        logger.warn({ requestId, issues: decoded.error.issues }, "Model output schema parsing failed; using fallback");
      }
    } catch (parseErr) {
      logger.warn({ requestId, err: parseErr.message }, "JSON parse failed on raw model output; using fallback");
    }
  }

  // If Gemini models encountered high demand (503) or rate limits or timed out, use deterministic scheme fallback
  if (!finalPlan) {
    logger.info({ requestId, lastError: lastError?.message }, "Engaging scheme-grounded deterministic fallback plan for instant response");
    finalPlan = generateSchemeGroundedFallback({ message, state, language, matchedSchemes });
  }

  // Sanitize URLs through Domain Guard
  const verifiedSources = sanitizeSources(finalPlan.officialSources);

  return {
    ...finalPlan,
    officialSources: verifiedSources,
    groundedSchemes: matchedSchemes.map((s) => ({
      code: s.code,
      title: s.title,
      category: s.category,
      portal: s.official_portal,
    })),
    disclaimer:
      finalPlan.disclaimer ||
      "JanSetu AI guidance is designed for public navigation. Confirm current requirements on the official government portals listed above.",
  };
}
