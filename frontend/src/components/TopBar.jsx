// ── src/components/TopBar.jsx ─────────────────────────────────────────────────
// Application header — title, sync button, connection indicator, user menu.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { callFunction } from "../services/functions";

const S = {
  bar: {
    height: 60, background: "#0D2137", borderBottom: "3px solid #2196F3",
    display: "flex", alignItems: "center", padding: "0 20px", gap: 16, flexShrink: 0,
  },
  title: {
    color: "#FFFFFF", fontSize: 16, fontWeight: 700, letterSpacing: "-0.2px",
    display: "flex", alignItems: "center", gap: 8, flex: 1,
  },
  dot: (online) => ({
    width: 8, height: 8, borderRadius: "50%",
    background: online ? "#4CAF50" : "#FF9800",
    flexShrink: 0,
  }),
  syncBtn: (syncing) => ({
    padding: "7px 16px",
    background: syncing ? "rgba(33,150,243,0.08)" : "rgba(33,150,243,0.15)",
    border: "1px solid rgba(33,150,243,0.4)",
    borderRadius: 6, color: "#90CAF9", fontSize: 13, fontWeight: 600,
    cursor: syncing ? "not-allowed" : "pointer", opacity: syncing ? 0.7 : 1,
    display: "flex", alignItems: "center", gap: 6,
  }),
  userArea: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 32, height: 32, borderRadius: "50%",
    border: "2px solid rgba(33,150,243,0.4)", objectFit: "cover",
  },
  avatarFallback: {
    width: 32, height: 32, borderRadius: "50%", background: "#2196F3",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#FFF", fontSize: 13, fontWeight: 700,
    border: "2px solid rgba(33,150,243,0.4)",
  },
  email:      { color: "#B0C4D8", fontSize: 13 },
  signOutBtn: {
    padding: "5px 12px", background: "transparent",
    border: "1px solid rgba(176,196,216,0.3)", borderRadius: 5,
    color: "#7899AA", fontSize: 12, cursor: "pointer",
  },
  toast: (type) => ({
    position: "fixed", bottom: 24, right: 24, zIndex: 9999,
    padding: "12px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
    background: type === "error" ? "#C62828" : "#1B5E20",
    color: "#FFFFFF", boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
  }),
};

export default function TopBar({ onSyncComplete }) {
  const { user, signOut }             = useAuth();
  const [syncing,   setSyncing]       = useState(false);
  const [toast,     setToast]         = useState(null);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await callFunction("syncEmails", { maxPerAccount: 30 });
      showToast(`Sync complete — ${result.synced} new, ${result.skipped} already seen`);
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      const msg = err.code === "functions/unauthenticated"
        ? "Please sign in again."
        : err.message?.includes("No connected accounts")
        ? "No Gmail account connected yet."
        : "Sync failed — please try again.";
      showToast(msg, "error");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      <div style={S.bar}>
        <div style={S.title}>
          <span style={S.dot(true)} title="Connected" />
          ✉️ &nbsp;AI-Powered Email Sorter
        </div>

        <button style={S.syncBtn(syncing)} onClick={handleSync} disabled={syncing}>
          {syncing ? "⟳ Syncing…" : "⟳ Sync Email"}
        </button>

        <div style={S.userArea}>
          {user?.photoURL
            ? <img src={user.photoURL} alt="avatar" style={S.avatar} />
            : <div style={S.avatarFallback}>{user?.email?.[0]?.toUpperCase() ?? "?"}</div>
          }
          <span style={S.email}>{user?.email}</span>
          <button style={S.signOutBtn} onClick={signOut}>Sign out</button>
        </div>
      </div>

      {toast && <div style={S.toast(toast.type)}>{toast.message}</div>}
    </>
  );
}
