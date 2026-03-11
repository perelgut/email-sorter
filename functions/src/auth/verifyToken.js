// ── src/auth/verifyToken.js ───────────────────────────────────────────────────
// Verifies the Firebase Auth token on every callable Cloud Function.
// All functions must call verifyToken(context) as their first line.
// ─────────────────────────────────────────────────────────────────────────────

const { HttpsError } = require("firebase-functions/v2/https");

/**
 * Verify the caller is authenticated.
 * @param {Object} context - Firebase callable request context (request.auth)
 * @returns {string} uid of the authenticated user
 * @throws {HttpsError} unauthenticated if no valid token
 */
function verifyToken(context) {
  if (!context || !context.uid) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required. Please sign in and try again."
    );
  }
  return context.uid;
}

module.exports = { verifyToken };
