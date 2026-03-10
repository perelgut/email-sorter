// ── src/context/FolderContext.jsx ─────────────────────────────────────────────
// Active folder state — shared between Sidebar, EmailListPanel, and routing.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState } from "react";

export const FOLDERS = [
  { id: "work",          label: "Work",          icon: "💼" },
  { id: "students",      label: "Students",      icon: "🎓" },
  { id: "newsletters",   label: "Newsletters",   icon: "📰" },
  { id: "receipts",      label: "Receipts",      icon: "🧾" },
  { id: "personal",      label: "Personal",      icon: "👤" },
  { id: "spam",          label: "Spam",          icon: "🚫" },
  { id: "uncategorized", label: "Uncategorized", icon: "🔬" },
];

const FolderContext = createContext(null);

export function FolderProvider({ children }) {
  const [activeFolder, setActiveFolder] = useState("uncategorized");

  return (
    <FolderContext.Provider value={{ activeFolder, setActiveFolder, folders: FOLDERS }}>
      {children}
    </FolderContext.Provider>
  );
}

export function useFolder() {
  const ctx = useContext(FolderContext);
  if (!ctx) throw new Error("useFolder must be used inside <FolderProvider>");
  return ctx;
}
