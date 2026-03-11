// ── src/services/functions.js ─────────────────────────────────────────────────
// Wrapper for calling Firebase Cloud Functions from the frontend.
// ─────────────────────────────────────────────────────────────────────────────

import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { app } from "../firebase";

const functions = getFunctions(app, "northamerica-northeast2");

if (process.env.REACT_APP_USE_EMULATORS === "true") {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

/**
 * Call a named Cloud Function with data.
 * @param {string} name - function name
 * @param {Object} data - request payload
 * @returns {Promise<any>} response data
 */
export async function callFunction(name, data = {}) {
  const fn     = httpsCallable(functions, name);
  const result = await fn(data);
  return result.data;
}
