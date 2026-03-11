// ── src/components/GmailCallback.jsx ─────────────────────────────────────────
// Handles the Gmail OAuth redirect callback.
// Exchanges the auth code via connectGmail Cloud Function, then redirects home.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { callFunction } from "../services/functions";
import { getRedirectUri } from "./ConnectGmailButton";

export default function GmailCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Connecting your Gmail account…");
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const err = params.get("error");

    if (err) {
      setError(`Google sign-in was cancelled or denied: ${err}`);
      setTimeout(() => navigate("/accounts"), 3000);
      return;
    }

    if (!code) {
      setError("No auth code received. Please try again.");
      setTimeout(() => navigate("/accounts"), 3000);
      return;
    }

    callFunction("connectGmail", { code, redirectUri: getRedirectUri() })
      .then((result) => {
        setStatus(`✓ Connected ${result.email}`);
        setTimeout(
          () => navigate("/accounts", { state: { connected: result.email } }),
          1500,
        );
      })
      .catch((e) => {
        console.error("connectGmail failed:", e);
        setError(e.message ?? "Failed to connect Gmail. Please try again.");
        setTimeout(() => navigate("/accounts"), 3000);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A1628",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        gap: 16,
      }}
    >
      {error ? (
        <>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ color: "#EF9A9A", fontSize: 15 }}>{error}</div>
          <div style={{ color: "#5A7A9A", fontSize: 13 }}>
            Redirecting back…
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              width: 36,
              height: 36,
              border: "3px solid rgba(33,150,243,0.2)",
              borderTopColor: "#2196F3",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ color: "#B0C4D8", fontSize: 15 }}>{status}</div>
        </>
      )}
    </div>
  );
}
