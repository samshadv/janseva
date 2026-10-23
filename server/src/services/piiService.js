/**
 * Indian PII (Personally Identifiable Information) Redactor Service
 * Detects and redacts Aadhaar numbers, PAN cards, phone numbers, and sensitive IDs
 * before queries reach LLMs or log storage, ensuring compliance with DPDP Act 2023.
 */

// Aadhaar: 12 digits (with optional spaces or hyphens), first digit 2-9
const AADHAAR_REGEX = /\b[2-9]{1}[0-9]{3}[-\s]?[0-9]{4}[-\s]?[0-9]{4}\b/g;

// PAN: 5 uppercase letters, 4 digits, 1 uppercase letter
const PAN_REGEX = /\b[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}\b/g;

// Indian Mobile: +91 or 0 prefix followed by 10 digits starting with 6, 7, 8, 9
const PHONE_REGEX = /(?:\+91[\s-]?)?[6-9]\d{9}\b/g;

// Bank Account Numbers: 9 to 18 digits sequence
const BANK_ACCOUNT_REGEX = /\b\d{9,18}\b/g;

/**
 * Checks if a text snippet contains sensitive Indian PII.
 */
export function containsSensitivePII(text) {
  if (!text || typeof text !== "string") return false;
  return (
    AADHAAR_REGEX.test(text) ||
    PAN_REGEX.test(text) ||
    PHONE_REGEX.test(text)
  );
}

/**
 * Redacts Aadhaar, PAN, phone numbers, and bank accounts from input text.
 */
export function redactPII(text) {
  if (!text || typeof text !== "string") return text;

  return text
    .replace(AADHAAR_REGEX, (match) => {
      const clean = match.replace(/[-\s]/g, "");
      return `[AADHAAR REDACTED-xxxx-${clean.slice(-4)}]`;
    })
    .replace(PAN_REGEX, (match) => {
      const clean = match.toUpperCase();
      return `[PAN REDACTED-xxxxx${clean.slice(-2)}]`;
    })
    .replace(PHONE_REGEX, "[PHONE REDACTED]")
    .replace(BANK_ACCOUNT_REGEX, (match) => {
      // Only mask if longer than 11 digits to avoid matching years/numbers
      if (match.length >= 11) {
        return `[ACCOUNT REDACTED-xxxx-${match.slice(-4)}]`;
      }
      return match;
    });
}
