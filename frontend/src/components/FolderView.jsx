// ── src/components/FolderView.jsx ─────────────────────────────────────────────
// Folder content area — stub until Task 2.5 implements the email list.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useFolder, FOLDERS } from "../context/FolderContext";

const S = {
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#9AB0C8",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  icon: { fontSize: 56, marginBottom: 16, opacity: 0.5 },
  heading: { fontSize: 20, fontWeight: 600, color: "#5A7A9A", marginBottom: 8 },
  sub: { fontSize: 14, color: "#7899AA" },
  badge: {
    marginTop: 24,
    padding: "6px 16px",
    background: "rgba(33,150,243,0.1)",
    border: "1px solid rgba(33,150,243,0.2)",
    borderRadius: 20,
    fontSize: 12,
    color: "#64B5F6",
  },
};

export default function FolderView() {
  const { folderId } = useParams();
  const { setActiveFolder } = useFolder();

  // Keep sidebar highlight in sync when navigating directly via URL
  useEffect(() => {
    if (folderId) setActiveFolder(folderId);
  }, [folderId, setActiveFolder]);

  const folder = FOLDERS.find((f) => f.id === folderId);
  if (!folder) {
    return (
      <div style={S.container}>
        <div style={S.icon}>🔍</div>
        <div style={S.heading}>Folder not found</div>
        <div style={S.sub}>"{folderId}" is not a valid folder.</div>
      </div>
    );
  }

  return (
    <div style={S.container}>
      <div style={S.icon}>{folder.icon}</div>
      <div style={S.heading}>{folder.label}</div>
      <div style={S.sub}>Email list implemented in Task 2.5</div>
      <div style={S.badge}>✓ Auth working · Routing working · Firestore connected</div>
    </div>
  );
}
