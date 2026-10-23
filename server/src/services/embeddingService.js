import { GoogleGenAI } from "@google/genai";
import { config } from "../config.js";
import { logger } from "../logger.js";

let _ai = null;

function getClient() {
  if (!_ai && config.GEMINI_API_KEY) {
    _ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  }
  return _ai;
}

/**
 * Generate 768-dimensional text embedding for semantic search.
 * Returns null if unconfigured or on failure.
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== "string") return null;

  if (!config.isApiKeyConfigured) {
    return null;
  }

  const ai = getClient();
  if (!ai) return null;

  try {
    const cleanText = text.trim().slice(0, 1500);
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: cleanText,
    });

    const values = response?.embedding?.values || null;
    return values;
  } catch (err) {
    logger.warn({ err: err.message }, "Embedding generation failed — falling back to keyword search");
    return null;
  }
}
