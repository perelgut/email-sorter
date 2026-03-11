// ── src/components/FolderView.jsx ─────────────────────────────────────────────
// Task 2.5 — Folder view + email list UI.
// Queries Firestore for emails in the active folder, renders a dense,
// scannable list with confidence scores and review flags.
// Email detail / body reading implemented in Task 3.1.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { useFolder, FOLDERS } from "../context/FolderContext";
import { useAuth } from "../context/AuthContext";

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return "";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

function confidenceColor(score) {
  if (score >= 0.85) return { text: "#4CAF50", bg: "rgba(76,175,80,0.10)" };
  if (score >= 0.75) return { text: "#8BC34A", bg: "rgba(139,195,74,0.10)" };
  if (score >= 0.6) return { text: "#FFC107", bg: "rgba(255,193,7,0.10)" };
  return { text: "#FF7043", bg: "rgba(255,112,67,0.10)" };
}

function initials(name, email) {
  const src = name || email || "?";
  const parts = src.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

// Deterministic avatar background from sender string
function avatarColor(str) {
  const palette = [
    "#1565C0",
    "#283593",
    "#4527A0",
    "#6A1B9A",
    "#AD1457",
    "#C62828",
    "#2E7D32",
    "#00695C",
    "#00838F",
    "#1565C0",
    "#0277BD",
    "#558B2F",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow({ delay }) {
  return (
    <div
      style={{
        ...S.row,
        cursor: "default",
        animation: `skeletonPulse 1.4s ease-in-out ${delay}s infinite`,
      }}
    >
      <div style={{ ...S.avatar, background: "rgba(90,122,154,0.15)" }} />
      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}
      >
        <div
          style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
        >
          <div
            style={{
              width: "22%",
              height: 12,
              borderRadius: 3,
              background: "rgba(90,122,154,0.18)",
            }}
          />
          <div
            style={{
              width: "8%",
              height: 10,
              borderRadius: 3,
              background: "rgba(90,122,154,0.12)",
            }}
          />
        </div>
        <div
          style={{
            width: "55%",
            height: 12,
            borderRadius: 3,
            background: "rgba(90,122,154,0.15)",
          }}
        />
        <div
          style={{
            width: "80%",
            height: 10,
            borderRadius: 3,
            background: "rgba(90,122,154,0.10)",
          }}
        />
      </div>
    </div>
  );
}

// ── Email row ─────────────────────────────────────────────────────────────────
function EmailRow({ email, selected, onClick }) {
  const [hovered, setHovered] = useState(false);
  const conf = confidenceColor(email.confidence ?? 0);
  const bg = selected
    ? "rgba(33,150,243,0.12)"
    : hovered
      ? "rgba(33,150,243,0.05)"
      : "transparent";

  return (
    <div
      style={{
        ...S.row,
        background: bg,
        borderLeft: selected ? "3px solid #2196F3" : "3px solid transparent",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Unread dot */}
      <div style={{ ...S.unreadDot, opacity: email.isRead ? 0 : 1 }} />

      {/* Avatar */}
      <div style={{ ...S.avatar, background: avatarColor(email.from || "?") }}>
        {initials(email.fromName, email.from)}
      </div>

      {/* Main content */}
      <div style={S.rowBody}>
        {/* Row 1: sender + date */}
        <div style={S.rowTop}>
          <span
            style={{ ...S.senderName, fontWeight: email.isRead ? 500 : 700 }}
          >
            {email.fromName || email.from}
          </span>
          <span style={S.dateStamp}>{formatDate(email.receivedAt)}</span>
        </div>

        {/* Row 2: subject */}
        <div style={{ ...S.subject, fontWeight: email.isRead ? 400 : 600 }}>
          {email.subject || "(no subject)"}
        </div>

        {/* Row 3: snippet + badges */}
        <div style={S.rowBottom}>
          <span style={S.snippet}>{email.snippet || ""}</span>
          <div style={S.badges}>
            {email.needsReview && (
              <span
                style={S.reviewBadge}
                title="Low-confidence classification — needs review"
              >
                ⚠ Review
              </span>
            )}
            {email.confidence != null && (
              <span
                style={{
                  ...S.confBadge,
                  color: conf.text,
                  background: conf.bg,
                }}
                title={`Classification confidence: ${Math.round(email.confidence * 100)}%`}
              >
                {Math.round(email.confidence * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ folder }) {
  const messages = {
    work: {
      icon: "💼",
      line: "No work emails here.",
      sub: "Classified work messages will appear here.",
    },
    students: {
      icon: "🎓",
      line: "No student emails.",
      sub: "Emails from students and institutions land here.",
    },
    newsletters: {
      icon: "📰",
      line: "No newsletters.",
      sub: "Subscriptions and digests will appear here.",
    },
    receipts: {
      icon: "🧾",
      line: "No receipts.",
      sub: "Order confirmations and invoices land here.",
    },
    personal: {
      icon: "👤",
      line: "Nothing personal.",
      sub: "Emails from friends and family appear here.",
    },
    spam: {
      icon: "🚫",
      line: "No spam detected.",
      sub: "Suspicious emails are held here.",
    },
    uncategorized: {
      icon: "🔬",
      line: "All sorted.",
      sub: "Low-confidence emails appear here for review.",
    },
  };
  const m = messages[folder?.id] ?? { icon: "📭", line: "No emails.", sub: "" };

  return (
    <div style={S.emptyState}>
      <div style={S.emptyIcon}>{m.icon}</div>
      <div style={S.emptyHeading}>{m.line}</div>
      <div style={S.emptySub}>{m.sub}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FolderView() {
  const { folderId } = useParams();
  const { setActiveFolder } = useFolder();
  const { user } = useAuth();

  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const folder = FOLDERS.find((f) => f.id === folderId);

  // Keep sidebar in sync with URL
  useEffect(() => {
    if (folderId) setActiveFolder(folderId);
  }, [folderId, setActiveFolder]);

  // Firestore fetch
  const fetchEmails = useCallback(async () => {
    if (!user?.uid || !folderId) return;
    setLoading(true);
    setError(null);
    setSelected(null);

    try {
      const db = getFirestore();
      const q = query(
        collection(db, `users/${user.uid}/emails`),
        where("folder", "==", folderId),
        orderBy("receivedAt", "desc"),
        limit(PAGE_SIZE),
      );
      const snap = await getDocs(q);
      setEmails(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("FolderView fetch error:", err);
      setError(err.message ?? "Failed to load emails.");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, folderId]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // ── Invalid folder ──────────────────────────────────────────────────────────
  if (!folder) {
    return (
      <div style={S.container}>
        <div style={S.emptyState}>
          <div style={S.emptyIcon}>🔍</div>
          <div style={S.emptyHeading}>Folder not found</div>
          <div style={S.emptySub}>"{folderId}" is not a valid folder.</div>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const reviewCount = emails.filter((e) => e.needsReview).length;

  return (
    <div style={S.container}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <span style={S.folderIcon}>{folder.icon}</span>
          <div>
            <div style={S.folderTitle}>{folder.label}</div>
            {!loading && !error && (
              <div style={S.folderMeta}>
                {emails.length === 0
                  ? "No messages"
                  : `${emails.length}${emails.length === PAGE_SIZE ? "+" : ""} message${emails.length !== 1 ? "s" : ""}`}
                {reviewCount > 0 && (
                  <span style={S.reviewCount}>
                    · {reviewCount} need{reviewCount === 1 ? "s" : ""} review
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          style={S.refreshBtn}
          onClick={fetchEmails}
          title="Refresh"
          disabled={loading}
        >
          <span
            style={{
              display: "inline-block",
              animation: loading ? "spin 0.8s linear infinite" : "none",
            }}
          >
            ↻
          </span>
        </button>
      </div>

      {/* ── Column headers ── */}
      {!loading && emails.length > 0 && (
        <div style={S.colHeader}>
          <div style={{ width: 8 }} />
          <div style={{ width: 36 }} />
          <div style={{ flex: 1, paddingLeft: 4 }}>FROM / SUBJECT</div>
          <div style={{ width: 110, textAlign: "right", paddingRight: 16 }}>
            CONF · DATE
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div style={S.listArea}>
        {loading && (
          <>
            {[0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48].map((d, i) => (
              <SkeletonRow key={i} delay={d} />
            ))}
          </>
        )}

        {!loading && error && (
          <div style={S.errorState}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ color: "#EF9A9A", fontWeight: 600, marginBottom: 6 }}>
              Failed to load emails
            </div>
            <div style={{ color: "#7899AA", fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
            <button style={S.retryBtn} onClick={fetchEmails}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && emails.length === 0 && (
          <EmptyState folder={folder} />
        )}

        {!loading &&
          !error &&
          emails.map((email) => (
            <EmailRow
              key={email.id}
              email={email}
              selected={selected === email.id}
              onClick={() =>
                setSelected(email.id === selected ? null : email.id)
              }
            />
          ))}
      </div>

      {/* ── Keyframes injected once ── */}
      <style>{`
        @keyframes spin            { to { transform: rotate(360deg); } }
        @keyframes skeletonPulse   { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    background: "#F0F4F8",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 20px 14px",
    borderBottom: "1px solid rgba(33,150,243,0.12)",
    background: "#FFFFFF",
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  folderIcon: {
    fontSize: 26,
    lineHeight: 1,
  },
  folderTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0A1628",
    letterSpacing: "-0.01em",
  },
  folderMeta: {
    fontSize: 12,
    color: "#7899AA",
    marginTop: 2,
  },
  reviewCount: {
    color: "#FFA726",
    fontWeight: 600,
    marginLeft: 4,
  },
  refreshBtn: {
    background: "transparent",
    border: "1px solid rgba(33,150,243,0.2)",
    borderRadius: 6,
    color: "#5A7A9A",
    fontSize: 18,
    width: 34,
    height: 34,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.12s, color 0.12s",
  },

  // Column headers
  colHeader: {
    display: "flex",
    alignItems: "center",
    padding: "6px 0 6px 12px",
    background: "#EEF2F7",
    borderBottom: "1px solid rgba(33,150,243,0.08)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#8AAABB",
    textTransform: "uppercase",
    flexShrink: 0,
    userSelect: "none",
  },

  // List area
  listArea: {
    flex: 1,
    overflowY: "auto",
    background: "#F0F4F8",
  },

  // Email row
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px 10px 12px",
    borderBottom: "1px solid rgba(33,150,243,0.06)",
    cursor: "pointer",
    transition: "background 0.1s",
    position: "relative",
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#2196F3",
    flexShrink: 0,
    transition: "opacity 0.15s",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#FFFFFF",
    flexShrink: 0,
    letterSpacing: "0.02em",
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  rowTop: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  senderName: {
    fontSize: 13,
    color: "#0A1628",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "60%",
  },
  dateStamp: {
    fontSize: 11,
    color: "#9AB0C8",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  subject: {
    fontSize: 13,
    color: "#1A3050",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  rowBottom: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  snippet: {
    fontSize: 12,
    color: "#7899AA",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
  },
  badges: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
  },
  confBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 4,
    fontFamily: "'Courier New', monospace",
    letterSpacing: "0.02em",
  },
  reviewBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 4,
    color: "#FFA726",
    background: "rgba(255,167,38,0.12)",
  },

  // Empty / error states
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    height: "100%",
  },
  emptyIcon: { fontSize: 52, marginBottom: 16, opacity: 0.45 },
  emptyHeading: {
    fontSize: 17,
    fontWeight: 600,
    color: "#5A7A9A",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: "#9AB0C8",
    textAlign: "center",
    maxWidth: 280,
  },
  errorState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    height: "100%",
  },
  retryBtn: {
    padding: "8px 20px",
    background: "rgba(33,150,243,0.15)",
    border: "1px solid rgba(33,150,243,0.3)",
    borderRadius: 6,
    color: "#64B5F6",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};
