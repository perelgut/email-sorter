// ── src/firebase.js ───────────────────────────────────────────────────────────
// Firebase app initialisation.
// Reads all config from REACT_APP_* environment variables so that no credentials
// are hardcoded. In CI/CD these are injected from GitHub Secrets at build time.
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// Connect to Firebase Emulator Suite in local development.
// Set REACT_APP_USE_EMULATORS=true in .env.local to activate.
if (process.env.REACT_APP_USE_EMULATORS === "true") {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
  console.log("🔧 Connected to Firebase Emulator Suite");
}

// Enable offline persistence (IndexedDB).
// Fails silently in Safari private mode or when multiple tabs are open — both
// are acceptable degraded states (falls back to memory-only mode).
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Firestore persistence unavailable — multiple tabs open");
  } else if (err.code === "unimplemented") {
    console.warn("Firestore persistence unavailable — browser not supported");
  }
});

export { app, auth, db };
