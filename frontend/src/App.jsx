// ── src/App.jsx ───────────────────────────────────────────────────────────────
// Root component.
// Wraps the app in AuthProvider + FolderProvider.
// Routes unauthenticated users to LoginPage.
// Routes authenticated users to MainLayout with folder sub-routes.
// ─────────────────────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FolderProvider } from "./context/FolderContext";
import LoginPage from "./components/LoginPage";
import MainLayout from "./components/MainLayout";
import FolderView from "./components/FolderView";

// Full-page loading spinner shown while Firebase resolves auth state on startup
function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A1628",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: "3px solid rgba(33,150,243,0.2)",
        borderTopColor: "#2196F3",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );
}

// Auth gate — renders children only when authenticated
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/folder/uncategorized" replace /> : <LoginPage />}
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
        {/* Default redirect from / to uncategorized folder */}
        <Route index element={<Navigate to="/folder/uncategorized" replace />} />
        <Route path="folder/:folderId" element={<FolderView />} />
      </Route>

      {/* Catch-all — redirect unknown paths to app root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
