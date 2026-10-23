/**
 * Domain Guard & URL Verification Engine
 * Strictly whitelists legitimate Indian Government, State, and Institutional domains.
 * Protects citizens from phishing domains, ad portals, and LLM-hallucinated URLs.
 */

const OFFICIAL_DOMAIN_PATTERNS = [
  /\.gov\.in$/i,
  /\.nic\.in$/i,
  /\.ac\.in$/i,
  /\.res\.in$/i,
  /^https?:\/\/([a-z0-9-]+\.)*india\.gov\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*myscheme\.gov\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*digilocker\.gov\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*voters\.eci\.gov\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*nvsp\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*uidai\.gov\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*pmkisan\.gov\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*pmjay\.gov\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*pmaymis\.gov\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*pmayg\.nic\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*scholarships\.gov\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*upsc\.gov\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*ssc\.gov\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*incometax\.gov\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*epfindia\.gov\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*maharashtra\.gov\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*mahadbt\.maharashtra\.gov\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*karnataka\.gov\.in/i,
  /^https?:\/\/([a-z0-9-]+\.)*up\.gov\.in/i
];

/**
 * Checks whether a URL is an official government domain.
 */
export function isOfficialGovDomain(urlStr) {
  if (!urlStr || typeof urlStr !== "string") return false;
  try {
    const parsed = new URL(urlStr.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    return OFFICIAL_DOMAIN_PATTERNS.some((pattern) => pattern.test(parsed.hostname));
  } catch {
    return false;
  }
}

/**
 * Sanitizes an array of sources returned by the AI.
 * Drops invalid or non-gov URLs, and flags legitimate ones with verified status.
 */
export function sanitizeSources(sources) {
  if (!Array.isArray(sources)) return [];

  const verified = [];
  const seen = new Set();

  for (const item of sources) {
    if (!item?.url) continue;
    const url = item.url.trim();

    if (isOfficialGovDomain(url) && !seen.has(url)) {
      seen.add(url);
      verified.push({
        title: item.title?.trim() || "Official Government Portal",
        url,
        why: item.why?.trim() || "Verify current official notices and requirements",
        isGovVerified: true,
      });
    }
  }

  // If AI generated zero verified gov links, provide the National Portal fallback
  if (verified.length === 0) {
    verified.push({
      title: "National Portal of India",
      url: "https://www.india.gov.in",
      why: "Official gateway to Indian Government services and schemes",
      isGovVerified: true,
    });
  }

  return verified;
}
