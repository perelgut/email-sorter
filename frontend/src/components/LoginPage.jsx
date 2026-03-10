// ── src/components/LoginPage.jsx ─────────────────────────────────────────────
// Sign-in page — shown to unauthenticated users.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0A1628 0%, #0D2137 60%, #1A3A5C 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(33,150,243,0.25)",
    borderRadius: 16,
    padding: "48px 56px",
    maxWidth: 420,
    width: "100%",
    textAlign: "center",
    backdropFilter: "blur(8px)",
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 8,
    letterSpacing: "-0.3px",
  },
  subtitle: {
    color: "#7899AA",
    fontSize: 14,
    marginBottom: 40,
    lineHeight: 1.5,
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    width: "100%",
    padding: "14px 24px",
    background: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    color: "#1A1A1A",
    cursor: "pointer",
    transition: "opacity 0.15s, transform 0.1s",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  error: {
    marginTop: 20,
    padding: "10px 16px",
    background: "rgba(244,67,54,0.12)",
    border: "1px solid rgba(244,67,54,0.3)",
    borderRadius: 6,
    color: "#EF9A9A",
    fontSize: 13,
  },
  spinner: {
    width: 18,
    height: 18,
    border: "2px solid rgba(26,26,26,0.2)",
    borderTopColor: "#1A1A1A",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
};

// Inline keyframes injected once
const styleTag = document.createElement("style");
styleTag.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleTag);

export default function LoginPage() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signIn();
    } catch (err) {
      // popup_closed_by_user is not an error — user dismissed the popup
      if (err.code !== "auth/popup-closed-by-user" &&
          err.code !== "auth/cancelled-popup-request") {
        setError("Sign-in failed. Please try again.");
        console.warn("Sign-in error:", err.code);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>✉️</div>
        <h1 style={styles.title}>AI-Powered Email Sorter</h1>
        <p style={styles.subtitle}>
          Sign in to automatically classify your emails<br />
          into organised folders using AI.
        </p>

        <button
          style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
          onClick={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <div style={styles.spinner} />
          ) : (
            <GoogleIcon />
          )}
          {loading ? "Signing in…" : "Continue with Google"}
        </button>

        {error && <div style={styles.error}>{error}</div>}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
