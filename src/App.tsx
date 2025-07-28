import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import { DashboardPage } from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import TenantsPage from "./pages/Tenants";
import UsersPage from "./pages/Users";
import TenantDocumentsPage from "./pages/TenantDocuments";
import ChatPage from "./pages/Chat";
import { Toaster } from "react-hot-toast";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeToggle } from "./components/ThemeToggle";
import ragnosticLogo from "./assets/ragnostic.png";

// Define protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Custom component that applies theme to toasts and renders the app content
const AppContent = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();

  // Navigation link style
  const navLinkStyle = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
      isActive
        ? "border-blue-500 text-gray-900 dark:text-white"
        : "border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
    }`;

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <nav className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <img
                    src={ragnosticLogo}
                    alt="RAGnostic Logo"
                    className="h-auto w-40"
                  />
                </div>
                {isAuthenticated && (
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <NavLink to="/" className={navLinkStyle}>
                      Dashboard
                    </NavLink>
                    <NavLink to="/documents" className={navLinkStyle}>
                      Documents
                    </NavLink>
                    <NavLink to="/chat" className={navLinkStyle}>
                      Chat
                    </NavLink>
                    {user?.role === "admin" && (
                      <>
                        <NavLink to="/tenants" className={navLinkStyle}>
                          Tenants
                        </NavLink>
                        <NavLink to="/users" className={navLinkStyle}>
                          Users
                        </NavLink>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                {isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {user ? `${user.firstName} ${user.lastName}` : ""}
                    </span>
                    <button
                      onClick={logout}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <NavLink to="/login" className={navLinkStyle}>
                      Login
                    </NavLink>
                    <NavLink to="/register" className={navLinkStyle}>
                      Register
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <TenantDocumentsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tenants"
              element={
                <ProtectedRoute>
                  <TenantsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: theme === "dark" ? "#1f2937" : "#ffffff",
            color: theme === "dark" ? "#f9fafb" : "#111827",
            border: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
          },
          success: {
            iconTheme: {
              primary: theme === "dark" ? "#10b981" : "#22c55e",
              secondary: "white",
            },
          },
          error: {
            iconTheme: {
              primary: theme === "dark" ? "#ef4444" : "#f87171",
              secondary: "white",
            },
          },
        }}
      />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
