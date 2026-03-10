// ── src/components/MainLayout.jsx ─────────────────────────────────────────────
// Three-panel application shell: TopBar + Sidebar + content area.
// ─────────────────────────────────────────────────────────────────────────────

import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

const S = {
  shell: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    background: "#F0F4F8",
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
    background: "#F0F4F8",
  },
};

export default function MainLayout() {
  return (
    <div style={S.shell}>
      <TopBar />
      <div style={S.body}>
        <Sidebar />
        <div style={S.content}>
          {/* Folder views rendered here via React Router <Outlet> */}
          <Outlet />
        </div>
      </div>
    </div>
  );
}
