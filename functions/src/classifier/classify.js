// ── src/classifier/classify.js ────────────────────────────────────────────────
// Email classification using Anthropic Claude Haiku.
// Called once per new email during sync. Returns folder assignment + confidence.
// ─────────────────────────────────────────────────────────────────────────────

const Anthropic = require("@anthropic-ai/sdk");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const VALID_FOLDERS = [
  "work",
  "students",
  "newsletters",
  "receipts",
  "personal",
  "spam",
  "uncategorized",
];

// ── Confidence thresholds ─────────────────────────────────────────────────────
// CONFIDENCE_THRESHOLD : minimum score to trust a folder assignment.
//   Below this → folder forced to "uncategorized" + needsReview = true.
// REVIEW_THRESHOLD     : emails above CONFIDENCE_THRESHOLD but still uncertain
//   enough to warrant a soft review flag (no folder override).
const CONFIDENCE_THRESHOLD = 0.6;
const REVIEW_THRESHOLD = 0.75;

const SYSTEM_PROMPT = `You are an email classification engine. Classify the email into exactly one of these folders: work, students, newsletters, receipts, personal, spam, uncategorized.

Respond with ONLY valid JSON in this exact format:
{"folder": "<folder_id>", "confidence": <0.0 to 1.0>}

Rules:
- No explanation. No markdown. No preamble. No extra fields.
- If confidence is below ${CONFIDENCE_THRESHOLD}, set folder to "uncategorized" regardless of your assessment.
- work: professional emails, colleagues, clients, business matters
- students: emails from students, academic institutions, course-related
- newsletters: bulk emails, marketing, subscriptions, digests
- receipts: purchase confirmations, invoices, order updates, shipping
- personal: friends, family, personal matters
- spam: unsolicited, suspicious, phishing attempts
- uncategorized: unclear or low confidence`;

/**
 * Derive a needsReview flag from confidence and folder assignment.
 *
 * needsReview is true when:
 *   (a) confidence < CONFIDENCE_THRESHOLD  → folder was forced to uncategorized, OR
 *   (b) confidence < REVIEW_THRESHOLD      → folder was assigned but uncertain
 *
 * @param {number} confidence
 * @param {string} finalFolder  - the folder after threshold enforcement
 * @param {string} rawFolder    - the folder Claude originally suggested
 * @returns {boolean}
 */
function deriveNeedsReview(confidence, finalFolder, rawFolder) {
  if (confidence < CONFIDENCE_THRESHOLD) return true; // (a) forced to uncategorized
  if (confidence < REVIEW_THRESHOLD) return true; // (b) placed but uncertain
  return false;
}

/**
 * Classify a single email using Claude Haiku.
 *
 * @param {Object} message - { from, fromName, subject, snippet }
 * @param {string} uid - Firebase Auth UID (used to fetch training context)
 * @returns {Promise<{
 *   folder:       string,
 *   confidence:   number,
 *   needsReview:  boolean,
 *   classifiedBy: string,
 *   tokensIn:     number,
 *   tokensOut:    number
 * }>}
 */
async function classifyEmail(message, uid) {
  const fallback = {
    folder: "uncategorized",
    confidence: 0.0,
    needsReview: true, // errors always need review
    classifiedBy: "ai",
    tokensIn: 0,
    tokensOut: 0,
  };

  try {
    const db = getFirestore();

    // Fetch training context (non-fatal if missing)
    let trainingContext = null;
    try {
      const tcSnap = await db.doc(`users/${uid}/trainingContext`).get();
      if (tcSnap.exists) trainingContext = tcSnap.data().contextString;
    } catch (_) {
      /* non-fatal */
    }

    // Build user message
    let userMessage = `From: ${message.from} (${message.fromName})\nSubject: ${message.subject}\nSnippet: ${(message.snippet || "").substring(0, 300)}`;

    if (trainingContext) {
      userMessage += `\n\n${trainingContext}`;
    }

    // Call Claude Haiku
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey)
      throw new Error("ANTHROPIC_API_KEY not available in environment");
    const client = new Anthropic.default({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 100,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const tokensIn = response.usage?.input_tokens ?? 0;
    const tokensOut = response.usage?.output_tokens ?? 0;

    // Parse response
    const raw = response.content?.[0]?.text ?? "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    const rawFolder = VALID_FOLDERS.includes(parsed.folder)
      ? parsed.folder
      : "uncategorized";
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.0;

    // Enforce confidence threshold → folder override
    const finalFolder =
      confidence >= CONFIDENCE_THRESHOLD ? rawFolder : "uncategorized";

    // Derive review flag
    const needsReview = deriveNeedsReview(confidence, finalFolder, rawFolder);

    return {
      folder: finalFolder,
      confidence,
      needsReview,
      classifiedBy: "ai",
      tokensIn,
      tokensOut,
    };
  } catch (err) {
    console.warn(
      `Classification failed for subject "${message.subject}":`,
      err.message,
    );
    return fallback;
  }
}

module.exports = { classifyEmail, CONFIDENCE_THRESHOLD, REVIEW_THRESHOLD };
