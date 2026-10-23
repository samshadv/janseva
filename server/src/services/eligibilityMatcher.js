import officialSchemes from "../db/seeds/officialSchemes.json" with { type: "json" };

/**
 * Income brackets in INR
 */
export const INCOME_BRACKET_MAP = {
  BELOW_1L: 100000,
  UPTO_2_5L: 250000,
  UPTO_5L: 500000,
  UPTO_8L: 800000,
  ABOVE_8L: 99999999,
};

/**
 * Match citizen profile with official schemes based on criteria.
 */
export function matchCitizenEligibility({ state, age, occupation, incomeBracket }) {
  const citizenAge = Number(age) || null;
  const citizenIncome = INCOME_BRACKET_MAP[incomeBracket] || 500000;
  const citizenOcc = occupation?.trim() || "Any";
  const citizenState = state?.trim() || "All";

  const results = [];

  for (const scheme of officialSchemes) {
    let matchScore = 0;
    let totalCriteria = 0;
    const reasons = [];

    const rules = scheme.eligibility_rules || {};

    // 1. State check
    totalCriteria += 1;
    const stateMatches =
      scheme.applicable_states.includes("All") ||
      citizenState === "All" ||
      scheme.applicable_states.includes(citizenState);

    if (stateMatches) {
      matchScore += 1;
      reasons.push(`Applicable in ${citizenState === "All" ? "all Indian states" : citizenState}`);
    } else {
      continue; // State-restricted scheme, skip
    }

    // 2. Age check
    if (citizenAge !== null) {
      if (rules.min_age !== undefined || rules.max_age !== undefined) {
        totalCriteria += 1;
        const minOk = rules.min_age === undefined || citizenAge >= rules.min_age;
        const maxOk = rules.max_age === undefined || citizenAge <= rules.max_age;
        if (minOk && maxOk) {
          matchScore += 1;
          reasons.push(`Meets age criteria (${rules.min_age || 0} - ${rules.max_age || "no limit"} yrs)`);
        } else {
          continue; // Age outside bounds
        }
      }
    }

    // 3. Income check
    if (rules.max_income !== undefined) {
      totalCriteria += 1;
      if (citizenIncome <= rules.max_income) {
        matchScore += 1;
        reasons.push(`Income qualifies for ceiling (₹${(rules.max_income / 100000).toFixed(1)} Lakh/yr)`);
      } else {
        continue; // Above income ceiling
      }
    }

    // 4. Occupation check
    if (rules.occupations && rules.occupations.length > 0) {
      totalCriteria += 1;
      const occMatches =
        rules.occupations.includes("Any") ||
        citizenOcc === "Any" ||
        rules.occupations.some((o) => o.toLowerCase() === citizenOcc.toLowerCase());

      if (occMatches) {
        matchScore += 1;
        reasons.push(`Targeted for: ${rules.occupations.join(", ")}`);
      } else {
        // Partial penalty rather than hard exclude if user picked generic
        matchScore += 0.5;
      }
    }

    const percentage = Math.round((matchScore / Math.max(totalCriteria, 1)) * 100);

    results.push({
      code: scheme.code,
      title: scheme.title,
      ministry: scheme.ministry_or_dept,
      category: scheme.category,
      summary: scheme.summary,
      officialPortal: scheme.official_portal,
      requiredDocuments: scheme.required_documents,
      matchPercentage: Math.min(percentage, 100),
      matchReasons: reasons,
    });
  }

  // Sort by match percentage descending
  results.sort((a, b) => b.matchPercentage - a.matchPercentage);
  return results;
}
