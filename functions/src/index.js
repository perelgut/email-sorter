// ── functions/src/index.js ────────────────────────────────────────────────────
// Cloud Functions entry point — AI-Powered Email Sorter
// Task: 1.3 — Firebase Project Setup
//
// This is a minimal deployment stub. Its only purpose is to prove that:
//   1. The Functions build pipeline works (npm ci + firebase deploy)
//   2. The deployed function appears healthy in Firebase Console
//   3. The CI/CD pipeline can reach Firebase with FIREBASE_TOKEN
//
// All application functions are implemented in Tasks 2.x onwards.
// ─────────────────────────────────────────────────────────────────────────────

const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Initialise Firebase Admin SDK.
// When deployed, credentials come from the Functions service account automatically.
// When running locally against the emulator, FIREBASE_PROJECT_ID env var is used.
admin.initializeApp();

/**
 * healthCheck — HTTPS callable stub.
 *
 * Returns a simple OK response so the pipeline can verify the deployed
 * function is reachable. Will be removed or replaced in a later task.
 *
 * @param {Object} data    - ignored
 * @param {Object} context - Firebase callable context
 * @returns {{ status: string, task: string, timestamp: string }}
 */
exports.healthCheck = onCall(
  { timeoutSeconds: 10, memory: "128MiB" },
  (request) => {
    return {
      status: "ok",
      task: "1.3 — Firebase project setup complete",
      timestamp: new Date().toISOString(),
    };
  },
);
