// ── functions/src/index.js ────────────────────────────────────────────────────
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

admin.initializeApp();

const { verifyToken } = require("./auth/verifyToken");
const { runSync } = require("./email/sync");
const { encrypt } = require("./auth/encryption");
const { google } = require("googleapis");

const anthropicKey = defineSecret("ANTHROPIC_API_KEY");
const encryptionSecret = defineSecret("ENCRYPTION_SECRET");

const ALLOWED_REDIRECT_URIS = [
  "https://perelgut.github.io/email-sorter/auth/gmail/callback",
  "http://localhost:3000/email-sorter/auth/gmail/callback",
];

// ── connectGmail ──────────────────────────────────────────────────────────────
exports.connectGmail = onCall(
  { timeoutSeconds: 30, memory: "256MiB", secrets: [encryptionSecret] },
  async (request) => {
    const uid = verifyToken(request.auth);
    const { code, redirectUri } = request.data;

    if (!code) throw new HttpsError("invalid-argument", "Missing auth code");

    if (!redirectUri || !ALLOWED_REDIRECT_URIS.includes(redirectUri)) {
      console.error(`Rejected redirect URI: ${redirectUri}`);
      throw new HttpsError("invalid-argument", "Invalid redirect URI");
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    );

    let tokens;
    try {
      const { tokens: t } = await oauth2Client.getToken(code);
      tokens = t;
    } catch (err) {
      console.error(
        "Gmail token exchange failed:",
        JSON.stringify({
          message: err.message,
          code: err.code,
          response: err?.response?.data,
        }),
        "redirect_uri:",
        redirectUri,
      );
      throw new HttpsError(
        "permission-denied",
        "Failed to exchange auth code. Please try again.",
      );
    }

    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: "me" });
    const email = profile.data.emailAddress;

    const db = getFirestore();
    const accountRef = db.collection(`users/${uid}/accounts`).doc();

    await accountRef.set({
      provider: "gmail",
      email,
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      tokenExpiresAt: new Date(tokens.expiry_date),
      status: "connected",
      connectedAt: FieldValue.serverTimestamp(),
      lastError: null,
    });

    return { success: true, email };
  },
);

// ── syncEmails ────────────────────────────────────────────────────────────────
exports.syncEmails = onCall(
  {
    timeoutSeconds: 300,
    memory: "512MiB",
    secrets: [anthropicKey, encryptionSecret],
  },
  async (request) => {
    const uid = verifyToken(request.auth);
    const maxPerAccount = Math.min(request.data?.maxPerAccount ?? 30, 100);

    try {
      const result = await runSync(uid, maxPerAccount);
      return result;
    } catch (err) {
      console.error("syncEmails failed:", err.message);
      throw new HttpsError("internal", `Sync failed: ${err.message}`);
    }
  },
);
