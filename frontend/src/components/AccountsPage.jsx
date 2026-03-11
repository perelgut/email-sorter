// ── src/components/AccountsPage.jsx ──────────────────────────────────────────
// Account management page — connect Gmail, view connected accounts.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import ConnectGmailButton from "./ConnectGmailButton";

const S = {
  page: {
    padding: 32,
    flex: 1,
    overflowY: "auto",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  heading: { fontSize: 22, fontWeight: 700, color: "#1A3A5C", marginBottom: 8 },
  sub: { color: "#5A7A9A", fontSize: 14, marginBottom: 32 },
  card: {
    background: "#FFFFFF",
    border: "1px solid #D0DEF0",
    borderRadius: 10,
    padding: "20px 24px",
    marginBottom: 16,
    maxWidth: 560,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1A3A5C",
    marginBottom: 4,
  },
  cardSub: { fontSize: 13, color: "#7899AA", marginBottom: 16 },
  accountRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderTop: "1px solid #EEF2F8",
  },
  dot: (connected) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: connected ? "#4CAF50" : "#FF9800",
    flexShrink: 0,
  }),
  accountEmail: { flex: 1, fontSize: 14, color: "#1A3A5C" },
  accountMeta: { fontSize: 12, color: "#9AB0C8" },
  empty: { fontSize: 13, color: "#9AB0C8", fontStyle: "italic" },
};

export default function AccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const location = useLocation();
  const [justConnected, setJustConnected] = useState(
    location.state?.connected ?? null,
  );

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      collection(db, `users/${user.uid}/accounts`),
      (snap) => setAccounts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
    return unsub;
  }, [user]);

  // Clear navigation state after showing banner
  useEffect(() => {
    if (location.state?.connected) {
      setTimeout(() => setJustConnected(null), 5000);
      window.history.replaceState({}, "");
    }
  }, []); // eslint-disable-line

  function handleConnected(email) {
    setJustConnected(email);
    setTimeout(() => setJustConnected(null), 5000);
  }

  return (
    <div style={S.page}>
      <div style={S.heading}>Email Accounts</div>
      <div style={S.sub}>
        Connect your email accounts to start syncing and classifying.
      </div>

      {justConnected && (
        <div
          style={{
            marginBottom: 20,
            padding: "10px 16px",
            background: "#E8F5E9",
            border: "1px solid #A5D6A7",
            borderRadius: 6,
            color: "#2E7D32",
            fontSize: 13,
          }}
        >
          ✓ Successfully connected <strong>{justConnected}</strong>
        </div>
      )}

      {/* Connected accounts */}
      <div style={S.card}>
        <div style={S.cardTitle}>Connected Accounts</div>
        <div style={S.cardSub}>
          {accounts.length === 0
            ? "No accounts connected yet."
            : `${accounts.length} account${accounts.length > 1 ? "s" : ""} connected`}
        </div>

        {accounts.length === 0 && (
          <div style={S.empty}>
            Connect a Gmail account below to get started.
          </div>
        )}

        {accounts.map((acc) => (
          <div key={acc.id} style={S.accountRow}>
            <div style={S.dot(acc.status === "connected")} />
            <div style={S.accountEmail}>
              {acc.email}
              {acc.lastError && (
                <div style={{ fontSize: 11, color: "#EF9A9A", marginTop: 2 }}>
                  {acc.lastError}
                </div>
              )}
            </div>
            <div style={S.accountMeta}>{acc.provider}</div>
          </div>
        ))}
      </div>

      {/* Add Gmail account */}
      <div style={S.card}>
        <div style={S.cardTitle}>Connect Gmail</div>
        <div style={S.cardSub}>
          Sign in with Google to grant read access to your Gmail inbox.
        </div>
        <ConnectGmailButton onConnected={handleConnected} />
      </div>

      {/* Outlook / IMAP — future phases */}
      <div style={{ ...S.card, opacity: 0.5 }}>
        <div style={S.cardTitle}>Connect Outlook / Microsoft 365</div>
        <div style={S.cardSub}>Available in Phase 5</div>
      </div>
      <div style={{ ...S.card, opacity: 0.5 }}>
        <div style={S.cardTitle}>Connect IMAP Account</div>
        <div style={S.cardSub}>Available in Phase 6</div>
      </div>
    </div>
  );
}
