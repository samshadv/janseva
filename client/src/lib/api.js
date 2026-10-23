/**
 * Normalized Backend API Base URL.
 * Automatically strips trailing slashes to ensure consistent path resolution across local and remote origins.
 * @type {string}
 */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

