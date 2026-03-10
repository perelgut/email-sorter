// ── src/components/TopBar.jsx ─────────────────────────────────────────────────
// Application header — title, sync button stub, user menu.
// ─────────────────────────────────────────────────────────────────────────────

import { useAuth } from "../context/AuthContext";

const S = {
  bar: {
    height: 60,
    background: "#0D2137",
    borderBottom: "3px solid #2196F3",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    gap: 16,
    flexShrink: 0,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "-0.2px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  syncBtn: {
    padding: "7px 16px",
    background: "rgba(33,150,243,0.15)",
    border: "1px solid rgba(33,150,243,0.4)",
    borderRadius: 6,
    color: "#90CAF9",
    fontSize: 13,
    fontWeight: 600,
    cursor: "not-allowed",
    opacity: 0.6,
  },
  userArea: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "2px solid rgba(33,150,243,0.4)",
    objectFit: "cover",
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#2196F3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFF",
    fontSize: 13,
    fontWeight: 700,
    border: "2px solid rgba(33,150,243,0.4)",
  },
  email: {
    color: "#B0C4D8",
    fontSize: 13,
  },
  signOutBtn: {
    padding: "5px 12px",
    background: "transparent",
    border: "1px solid rgba(176,196,216,0.3)",
    borderRadius: 5,
    color: "#7899AA",
    fontSize: 12,
    cursor: "pointer",
  },
};

export default function TopBar() {
  const { user, signOut } = useAuth();

  return (
    <div style={S.bar}>
      <div style={S.title}>
        ✉️ &nbsp;AI-Powered Email Sorter
      </div>

      {/* Sync button — enabled in Task 2.5 */}
      <button style={S.syncBtn} disabled title="Sync implemented in Task 2.5">
        ⟳ &nbsp;Sync Email
      </button>

      <div style={S.userArea}>
        {user?.photoURL ? (
          <img src={user.photoURL} alt="avatar" style={S.avatar} />
        ) : (
          <div style={S.avatarFallback}>
            {user?.email?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <span style={S.email}>{user?.email}</span>
        <button style={S.signOutBtn} onClick={signOut}>Sign out</button>
      </div>
    </div>
  );
}
