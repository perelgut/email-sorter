// ── src/context/AuthContext.jsx ───────────────────────────────────────────────
// Firebase Auth state provider.
// Exposes: user, loading, signIn, signOut, getIdToken via useAuth() hook.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Create or update the user's Firestore profile document on every sign-in.
        // merge:true ensures existing fields (e.g. createdAt) are not overwritten.
        try {
          await setDoc(
            doc(db, "users", firebaseUser.uid),
            {
              uid:          firebaseUser.uid,
              email:        firebaseUser.email,
              displayName:  firebaseUser.displayName,
              photoURL:     firebaseUser.photoURL,
              lastLoginAt:  serverTimestamp(),
            },
            { merge: true }
          );
        } catch (err) {
          // Non-fatal — user is still authenticated even if Firestore write fails.
          console.warn("Failed to update user profile in Firestore:", err.code);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe; // detach listener on unmount
  }, []);

  async function signIn() {
    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");
    await signInWithPopup(auth, provider);
    // onAuthStateChanged fires automatically after successful sign-in —
    // no need to manually update state here.
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  async function getIdToken() {
    if (!auth.currentUser) throw new Error("No authenticated user");
    return auth.currentUser.getIdToken();
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
}

/** useAuth — consume auth context in any component */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
