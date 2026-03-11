// ── src/email/gmail.js ────────────────────────────────────────────────────────
// Gmail provider module.
// Fetches unread messages from Gmail and returns normalised message objects.
// ─────────────────────────────────────────────────────────────────────────────

const { google } = require("googleapis");
const { getGoogleOAuthClient } = require("../auth/tokenManager");

/**
 * Fetch unread messages from the user's Gmail inbox.
 *
 * @param {string} uid - Firebase Auth UID
 * @param {FirebaseFirestore.DocumentSnapshot} accountSnap - account document snapshot
 * @param {FirebaseFirestore.Firestore} db - Firestore Admin instance
 * @param {number} maxResults - max messages to fetch (capped at 100)
 * @returns {Promise<Array>} array of normalised message objects
 */
async function fetchMessages(uid, accountSnap, db, maxResults = 30) {
  const account = accountSnap.data();
  maxResults = Math.min(maxResults, 100);

  let oauth2Client;
  try {
    oauth2Client = await getGoogleOAuthClient(accountSnap, db);
  } catch (err) {
    err.accountId = accountSnap.id;
    throw err;
  }

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // ── Fetch list of unread message IDs ──────────────────────────────────────
  let messageIds;
  try {
    const listRes = await gmail.users.messages.list({
      userId:     "me",
      q:          "is:unread in:inbox",
      maxResults,
    });
    messageIds = listRes.data.messages ?? [];
  } catch (err) {
    handleGmailError(err, accountSnap.id);
  }

  if (messageIds.length === 0) return [];

  // ── Fetch metadata for each message ──────────────────────────────────────
  const messages = await Promise.allSettled(
    messageIds.map((m) =>
      gmail.users.messages.get({
        userId:          "me",
        id:              m.id,
        format:          "metadata",
        metadataHeaders: ["From", "Subject", "Date", "Message-ID"],
      })
    )
  );

  const results = [];
  for (const result of messages) {
    if (result.status === "rejected") {
      console.warn("Failed to fetch message metadata:", result.reason?.message);
      continue;
    }

    const msg     = result.value.data;
    const headers = msg.payload?.headers ?? [];

    function header(name) {
      return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
    }

    const fromRaw  = header("From");
    const fromName = fromRaw.replace(/<.*>/, "").trim().replace(/^"|"$/g, "");
    const fromAddr = (fromRaw.match(/<(.+)>/) ?? [, fromRaw])[1].trim();
    const dateStr  = header("Date");

    results.push({
      providerId:  msg.id,
      provider:    "gmail",
      accountId:   accountSnap.id,
      threadId:    msg.threadId,
      from:        fromAddr,
      fromName:    fromName || fromAddr,
      subject:     header("Subject") || "(no subject)",
      snippet:     (msg.snippet ?? "").substring(0, 300),
      messageId:   header("Message-ID"),
      receivedAt:  dateStr ? new Date(dateStr) : new Date(),
    });
  }

  return results;
}

/**
 * Fetch the full body of a single Gmail message.
 *
 * @param {OAuth2Client} oauth2Client
 * @param {string} messageId
 * @returns {Promise<{bodyHtml: string|null, bodyText: string}>}
 */
async function getMessageBody(oauth2Client, messageId) {
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const res   = await gmail.users.messages.get({
    userId: "me",
    id:     messageId,
    format: "full",
  });

  const payload = res.data.payload;
  let bodyHtml  = null;
  let bodyText  = "";

  function extractParts(part) {
    if (!part) return;
    if (part.mimeType === "text/html" && part.body?.data) {
      bodyHtml = Buffer.from(part.body.data, "base64url").toString("utf8");
    } else if (part.mimeType === "text/plain" && part.body?.data && !bodyText) {
      bodyText = Buffer.from(part.body.data, "base64url").toString("utf8");
    }
    if (part.parts) part.parts.forEach(extractParts);
  }

  extractParts(payload);

  // Fallback: top-level body data
  if (!bodyText && !bodyHtml && payload?.body?.data) {
    bodyText = Buffer.from(payload.body.data, "base64url").toString("utf8");
  }

  return { bodyHtml, bodyText: bodyText || "" };
}

/**
 * Move a Gmail message to Trash.
 */
async function trashMessage(oauth2Client, messageId) {
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  await gmail.users.messages.trash({ userId: "me", id: messageId });
}

// ── Error handler ─────────────────────────────────────────────────────────────
function handleGmailError(err, accountId) {
  const status = err?.response?.status ?? err?.code;
  console.error(`Gmail API error for account ${accountId}: status=${status}`, err.message);

  if (status === 401 || status === 403) {
    const e = new Error("Gmail authentication error — please reconnect your account.");
    e.code  = "auth_error";
    throw e;
  }
  if (status === 429) {
    const e = new Error("Gmail rate limit reached — please try again shortly.");
    e.code  = "rate_limit";
    throw e;
  }
  const e = new Error(`Gmail network error: ${err.message}`);
  e.code  = "network_error";
  throw e;
}

module.exports = { fetchMessages, getMessageBody, trashMessage };
