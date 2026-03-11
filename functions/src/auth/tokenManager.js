// ── src/auth/tokenManager.js ──────────────────────────────────────────────────
// OAuth token refresh helpers.
// Checks token expiry and refreshes via Google's token endpoint when needed.
// ─────────────────────────────────────────────────────────────────────────────

const { google } = require("googleapis");
const { encrypt, decrypt } = require("./encryption");

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh if within 5 minutes of expiry

/**
 * Get a valid Google OAuth2 client for the given account document.
 * Refreshes the access token if it is expired or about to expire.
 *
 * @param {FirebaseFirestore.DocumentSnapshot} accountSnap - Firestore account document snapshot
 * @param {FirebaseFirestore.Firestore} db - Firestore Admin instance
 * @returns {Promise<OAuth2Client>} authenticated OAuth2 client
 */
async function getGoogleOAuthClient(accountSnap, db) {
  const account = accountSnap.data();

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "postmessage" // redirect_uri for server-side token exchange
  );

  let accessToken = decrypt(account.accessToken);
  const expiresAt = account.tokenExpiresAt?.toMillis?.() ?? 0;
  const now       = Date.now();

  // Refresh if token is expired or within the buffer window
  if (now >= expiresAt - REFRESH_BUFFER_MS) {
    const refreshToken = decrypt(account.refreshToken);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      accessToken = credentials.access_token;

      // Persist the new token and expiry back to Firestore
      await accountSnap.ref.update({
        accessToken:    encrypt(accessToken),
        tokenExpiresAt: new Date(credentials.expiry_date),
        lastRefreshedAt: new Date(),
      });
    } catch (err) {
      console.error(`Token refresh failed for account ${accountSnap.id}:`, err.message);
      await accountSnap.ref.update({ lastError: `Token refresh failed: ${err.message}` });
      const e = new Error("Gmail authentication expired — please reconnect your account.");
      e.code  = "auth_error";
      throw e;
    }
  }

  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}

module.exports = { getGoogleOAuthClient };
