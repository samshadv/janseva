// Client-side quick PII detector
const AADHAAR_REGEX = /\b[2-9]{1}[0-9]{3}[-\s]?[0-9]{4}[-\s]?[0-9]{4}\b/;
const PAN_REGEX = /\b[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}\b/;

export function detectClientPII(text) {
  if (!text || typeof text !== "string") return null;

  if (AADHAAR_REGEX.test(text)) {
    return "Aadhaar number detected! For your privacy, JanSetu automatically masks sensitive identity numbers before processing.";
  }

  if (PAN_REGEX.test(text)) {
    return "PAN card number detected! For your privacy, JanSetu automatically masks sensitive identity numbers before processing.";
  }

  return null;
}
