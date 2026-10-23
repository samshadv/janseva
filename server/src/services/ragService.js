import { getSupabase } from "../db/supabase.js";
import { generateEmbedding } from "./embeddingService.js";
import { logger } from "../logger.js";
import officialSchemes from "../db/seeds/officialSchemes.json" with { type: "json" };

/**
 * Searches official schemes using vector embedding when Supabase pgvector is available,
 * and falls back to fast catalog matching when database is unconfigured.
 */
export async function retrieveRelevantSchemes(query, state = "All") {
  if (!query || typeof query !== "string") return [];

  const supabase = getSupabase();

  // Try Vector Embedding Search via Supabase if configured
  if (supabase) {
    try {
      const embedding = await generateEmbedding(query);
      if (embedding) {
        const { data, error } = await supabase.rpc("match_schemes", {
          query_embedding: embedding,
          match_threshold: 0.55,
          match_count: 3,
          filter_state: state || "All",
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          logger.debug({ count: data.length }, "Retrieved schemes via pgvector similarity");
          return data;
        }
      }
    } catch (err) {
      logger.warn({ err: err.message }, "Vector search failed, using local catalog match");
    }
  }

  // Fallback: Local Catalog Keyword and State Matcher
  const queryLower = query.toLowerCase();
  const matched = [];

  for (const scheme of officialSchemes) {
    // Check state eligibility
    const stateMatches =
      state === "All" ||
      scheme.applicable_states.includes("All") ||
      scheme.applicable_states.includes(state);

    if (!stateMatches) continue;

    // Keyword match across title, category, summary, and code
    const textBlob = `${scheme.title} ${scheme.category} ${scheme.summary} ${scheme.code} ${scheme.required_documents.join(" ")}`.toLowerCase();

    const words = queryLower
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const matchCount = words.filter((w) => textBlob.includes(w)).length;

    if (matchCount > 0) {
      matched.push({
        ...scheme,
        score: matchCount,
      });
    }
  }

  matched.sort((a, b) => b.score - a.score);
  return matched.slice(0, 3);
}

/**
 * Formats retrieved schemes into a grounded prompt context string for Gemini.
 */
export function formatSchemesForPrompt(schemes) {
  if (!Array.isArray(schemes) || schemes.length === 0) {
    return "";
  }

  const sections = schemes.map((s, index) => {
    return `[SCHEME ${index + 1}]
Name: ${s.title} (${s.code})
Nodal Authority: ${s.ministry_or_dept}
Category: ${s.category}
Official Portal: ${s.official_portal}
Required Documents to check: ${s.required_documents?.join(", ") || "Aadhaar, Bank Passbook"}
Key Application Steps:
${s.application_steps?.map((step, i) => `  ${i + 1}. ${step}`).join("\n") || "Check official portal."}`;
  });

  return `\n--- VERIFIED GOVERNMENT SCHEME REFERENCE DATA (GROUND TRUTH) ---
Use the following official verified data to inform your next steps, checklist, and sources. DO NOT invent alternative URLs or non-gov portals.
${sections.join("\n\n")}
-------------------------------------------------------------------\n`;
}
