import { getSupabase } from "../db/supabase.js";
import { logger } from "../logger.js";

/**
 * Verifies the Supabase JWT token from Authorization: Bearer <token>.
 * If valid, attaches req.user = { id, email } to the request.
 * If required === true and token is missing or invalid: responds with 401.
 * If required === false: allows request to pass through without req.user.
 */
export function authenticate({ required = false } = {}) {
  return async function (req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      if (required) {
        return res.status(401).json({ error: "Authentication required." });
      }
      return next();
    }

    const supabase = getSupabase();
    if (!supabase) {
      // Supabase not configured on server — skip auth silently if not required
      if (required) {
        return res.status(503).json({ error: "Authentication service not configured on server." });
      }
      return next();
    }

    try {
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data?.user) {
        if (required) {
          return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
        }
        return next();
      }

      req.user = {
        id: data.user.id,
        email: data.user.email,
      };

      logger.debug({ requestId: req.id, userId: req.user.id }, "User authenticated");
      next();
    } catch (err) {
      logger.error({ requestId: req.id, err: err.message }, "authenticate_error");
      if (required) {
        return res.status(401).json({ error: "Could not verify session." });
      }
      next();
    }
  };
}
