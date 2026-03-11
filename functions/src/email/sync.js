// ── src/email/sync.js ─────────────────────────────────────────────────────────
// Core sync orchestration.
// Fetches emails from all connected accounts, deduplicates, classifies, writes.
// ─────────────────────────────────────────────────────────────────────────────

const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { fetchMessages } = require("./gmail");
const { classifyEmail } = require("../classifier/classify");

/**
 * Run a full email sync for a user.
 *
 * @param {string} uid
 * @param {number} maxPerAccount - max emails to fetch per account
 * @returns {Promise<{synced: number, skipped: number, errors: Array}>}
 */
async function runSync(uid, maxPerAccount = 30) {
  const db = getFirestore();
  const results = { synced: 0, skipped: 0, errors: [], claudeCalls: 0, tokensIn: 0, tokensOut: 0 };

  // ── 1. Load all connected accounts ───────────────────────────────────────
  const accountsSnap = await db
    .collection(`users/${uid}/accounts`)
    .where("status", "==", "connected")
    .get();

  if (accountsSnap.empty) {
    console.log(`No connected accounts for uid ${uid}`);
    return results;
  }

  // ── 2. Fetch messages from all accounts in parallel ───────────────────────
  const fetchResults = await Promise.allSettled(
    accountsSnap.docs.map((accountSnap) => {
      const provider = accountSnap.data().provider;
      switch (provider) {
        case "gmail":
          return fetchMessages(uid, accountSnap, db, maxPerAccount);
        default:
          console.warn(`Unknown provider: ${provider} for account ${accountSnap.id}`);
          return Promise.resolve([]);
      }
    })
  );

  // Collect messages and record account-level errors
  const allMessages = [];
  fetchResults.forEach((result, i) => {
    const accountSnap = accountsSnap.docs[i];
    if (result.status === "fulfilled") {
      allMessages.push(...result.value);
      // Clear any previous error
      accountSnap.ref.update({ lastError: null, lastSyncAt: new Date() }).catch(() => {});
    } else {
      console.error(`Fetch failed for account ${accountSnap.id}:`, result.reason?.message);
      results.errors.push({ accountId: accountSnap.id, message: result.reason?.message ?? "Unknown error" });
      accountSnap.ref.update({ lastError: result.reason?.message ?? "Sync failed" }).catch(() => {});
    }
  });

  if (allMessages.length === 0) {
    await db.doc(`users/${uid}`).update({ lastSyncAt: FieldValue.serverTimestamp() }).catch(() => {});
    return results;
  }

  // ── 3. Deduplicate against existing Firestore records ─────────────────────
  // Batch existence checks — query by providerId for each message
  const existingSnaps = await Promise.allSettled(
    allMessages.map((msg) =>
      db.collection(`users/${uid}/emails`)
        .where("providerId", "==", msg.providerId)
        .limit(1)
        .get()
    )
  );

  const newMessages = allMessages.filter((_, i) => {
    const snap = existingSnaps[i];
    return snap.status === "fulfilled" && snap.value.empty;
  });

  results.skipped = allMessages.length - newMessages.length;

  if (newMessages.length === 0) {
    await db.doc(`users/${uid}`).update({ lastSyncAt: FieldValue.serverTimestamp() }).catch(() => {});
    return results;
  }

  // ── 4. Classify each new message ──────────────────────────────────────────
  const classifications = await Promise.allSettled(
    newMessages.map((msg) => classifyEmail(msg, uid))
  );

  // ── 5. Batch write email documents ────────────────────────────────────────
  const BATCH_SIZE = 400; // Firestore limit is 500; leave headroom
  let batch = db.batch();
  let batchCount = 0;

  for (let i = 0; i < newMessages.length; i++) {
    const msg = newMessages[i];
    const cls = classifications[i].status === "fulfilled"
      ? classifications[i].value
      : { folder: "uncategorized", confidence: 0.0, classifiedBy: "ai", tokensIn: 0, tokensOut: 0 };

    results.tokensIn  += cls.tokensIn  ?? 0;
    results.tokensOut += cls.tokensOut ?? 0;
    if (cls.classifiedBy === "ai") results.claudeCalls++;

    const emailRef = db.collection(`users/${uid}/emails`).doc(msg.providerId);
    batch.set(emailRef, {
      providerId:    msg.providerId,
      provider:      msg.provider,
      accountId:     msg.accountId,
      threadId:      msg.threadId ?? null,
      messageId:     msg.messageId ?? null,
      from:          msg.from,
      fromName:      msg.fromName,
      subject:       msg.subject,
      snippet:       msg.snippet,
      receivedAt:    msg.receivedAt,
      folder:        cls.folder,
      confidence:    cls.confidence,
      classifiedBy:  cls.classifiedBy,
      matchedRuleId: cls.matchedRuleId ?? null,
      isRead:        false,
      isTrainingExample: false,
      bodyText:      null,
      syncedAt:      FieldValue.serverTimestamp(),
    });
    batchCount++;
    results.synced++;

    // Commit batch when it hits the size limit
    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      batch      = db.batch();
      batchCount = 0;
    }
  }

  // Commit any remaining writes
  if (batchCount > 0) await batch.commit();

  // ── 6. Update user lastSyncAt ─────────────────────────────────────────────
  await db.doc(`users/${uid}`).update({ lastSyncAt: FieldValue.serverTimestamp() }).catch(() => {});

  console.log(`Sync complete for ${uid}: synced=${results.synced} skipped=${results.skipped} claudeCalls=${results.claudeCalls}`);
  return results;
}

module.exports = { runSync };
