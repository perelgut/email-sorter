// ── src/components/Sidebar.jsx ────────────────────────────────────────────────

import { useNavigate, useLocation } from "react-router-dom";
import { useFolder } from "../context/FolderContext";

const S = {
  sidebar: {
    width: 220, minWidth: 220, background: "#0A1628",
    borderRight: "1px solid rgba(33,150,243,0.15)",
    display: "flex", flexDirection: "column", overflowY: "auto",
  },
  sectionLabel: {
    padding: "20px 16px 8px", color: "#3A5A7C",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
  },
  item: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 16px", cursor: "pointer", borderRadius: 6,
    margin: "1px 8px", transition: "background 0.12s",
    color: "#B0C4D8", fontSize: 14, userSelect: "none",
  },
  itemActive: { background: "rgba(33,150,243,0.18)", color: "#FFFFFF" },
  icon:       { fontSize: 15, width: 20, textAlign: "center", flexShrink: 0 },
  label:      { flex: 1, fontWeight: 500 },
  footer:     {
    marginTop: "auto", padding: "8px",
    borderTop: "1px solid rgba(33,150,243,0.1)",
  },
};

function NavItem({ icon, label, path, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === path || location.pathname.startsWith(path + "/");
  return (
    <div
      style={{ ...S.item, ...(isActive ? S.itemActive : {}) }}
      onClick={onClick}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={S.icon}>{icon}</span>
      <span style={S.label}>{label}</span>
    </div>
  );
}

export default function Sidebar() {
  const { folders, setActiveFolder } = useFolder();
  const navigate = useNavigate();

  return (
    <div style={S.sidebar}>
      <div style={S.sectionLabel}>Folders</div>
      {folders.map((folder) => (
        <NavItem
          key={folder.id}
          icon={folder.icon}
          label={folder.label}
          path={`/folder/${folder.id}`}
          onClick={() => { setActiveFolder(folder.id); navigate(`/folder/${folder.id}`); }}
        />
      ))}

      <div style={S.sectionLabel}>Settings</div>
      <NavItem icon="📧" label="Accounts"  path="/accounts" onClick={() => navigate("/accounts")} />
      <NavItem icon="📋" label="Rules"     path="/rules"    onClick={() => navigate("/rules")} />
      <NavItem icon="📊" label="Usage"     path="/usage"    onClick={() => navigate("/usage")} />
    </div>
  );
}
