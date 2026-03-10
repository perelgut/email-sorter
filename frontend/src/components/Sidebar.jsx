// ── src/components/Sidebar.jsx ────────────────────────────────────────────────
// Left sidebar — folder list navigation.
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from "react-router-dom";
import { useFolder } from "../context/FolderContext";

const S = {
  sidebar: {
    width: 220,
    minWidth: 220,
    background: "#0A1628",
    borderRight: "1px solid rgba(33,150,243,0.15)",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  sectionLabel: {
    padding: "20px 16px 8px",
    color: "#3A5A7C",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  folderItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 16px",
    cursor: "pointer",
    borderRadius: 6,
    margin: "1px 8px",
    transition: "background 0.12s",
    color: "#B0C4D8",
    fontSize: 14,
    userSelect: "none",
  },
  folderItemActive: {
    background: "rgba(33,150,243,0.18)",
    color: "#FFFFFF",
  },
  folderIcon: {
    fontSize: 15,
    width: 20,
    textAlign: "center",
    flexShrink: 0,
  },
  folderLabel: {
    flex: 1,
    fontWeight: 500,
  },
  countBadge: {
    background: "rgba(33,150,243,0.25)",
    color: "#90CAF9",
    fontSize: 11,
    fontWeight: 700,
    padding: "1px 7px",
    borderRadius: 10,
  },
  footer: {
    marginTop: "auto",
    padding: "16px",
    borderTop: "1px solid rgba(33,150,243,0.1)",
    color: "#3A5A7C",
    fontSize: 11,
  },
};

export default function Sidebar() {
  const { folders, activeFolder, setActiveFolder } = useFolder();
  const navigate = useNavigate();

  function handleFolderClick(folderId) {
    setActiveFolder(folderId);
    navigate(`/folder/${folderId}`);
  }

  return (
    <div style={S.sidebar}>
      <div style={S.sectionLabel}>Folders</div>

      {folders.map((folder) => {
        const isActive = folder.id === activeFolder;
        return (
          <div
            key={folder.id}
            style={{
              ...S.folderItem,
              ...(isActive ? S.folderItemActive : {}),
            }}
            onClick={() => handleFolderClick(folder.id)}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={S.folderIcon}>{folder.icon}</span>
            <span style={S.folderLabel}>{folder.label}</span>
            {/* Count badges populated in Task 2.6 */}
          </div>
        );
      })}

      <div style={S.footer}>
        Accounts — Task 6.5
      </div>
    </div>
  );
}
