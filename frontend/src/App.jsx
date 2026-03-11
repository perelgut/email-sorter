// ── src/App.jsx ───────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FolderProvider } from "./context/FolderContext";
import LoginPage from "./components/LoginPage";
import MainLayout from "./components/MainLayout";
import FolderView from "./components/FolderView";
import AccountsPage from "./components/AccountsPage";
import GmailCallback from "./components/GmailCallback";

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A1628",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid rgba(33,150,243,0.2)",
          borderTopColor: "#2196F3",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* OAuth callback — must be outside RequireAuth, no app chrome */}
      <Route path="/auth/gmail/callback" element={<GmailCallback />} />

      <Route
        path="/login"
        element={
          user ? <Navigate to="/folder/uncategorized" replace /> : <LoginPage />
        }
      />

      <Route
        path="/"
        element={
          <RequireAuth>
            <FolderProvider>
              <MainLayout />
            </FolderProvider>
          </RequireAuth>
        }
      >
        <Route
          index
          element={<Navigate to="/folder/uncategorized" replace />}
        />
        <Route path="folder/:folderId" element={<FolderView />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route
          path="rules"
          element={
            <PlaceholderPage title="Rules" note="Implemented in Task 4.1" />
          }
        />
        <Route
          path="usage"
          element={
            <PlaceholderPage
              title="Usage Dashboard"
              note="Implemented in Task 7.2"
            />
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function PlaceholderPage({ title, note }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#9AB0C8",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>🚧</div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: "#5A7A9A",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 13, color: "#7899AA" }}>{note}</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/email-sorter">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
