import { useEffect, lazy, Suspense } from "react"
import { Navigate, Routes, Route } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { ToastProvider } from "@/components/ui/Toast"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { WalletProvider } from "@/context/WalletContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { CurrencyProvider } from "@/context/CurrencyContext"
import { ScrollToTop } from "@/components/common/ScrollToTop"
import { GlobalErrorBoundary, RouteErrorBoundary } from "@/components/common/ErrorBoundary"
import { setupGlobalErrorListeners } from "@/lib/errorLogger"
import { AiAssistantDrawer } from "@/components/ai/AiAssistantDrawer"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"

// H-3R: Chunk load retry with reload protection (prevents infinite loops)
function lazyRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch((err: Error) => {
      if (
        err?.message?.includes("Failed to fetch dynamically imported module") ||
        err?.name === "ChunkLoadError"
      ) {
        if (!sessionStorage.getItem("chunk_reload_attempted")) {
          sessionStorage.setItem("chunk_reload_attempted", "1")
          window.location.reload()
          return new Promise(() => {}) // Page reloads, never resolves
        }
      }
      throw err // Falls through to ErrorBoundary
    }),
  )
}

// Dynamic code-split page imports (mapped for named exports)
const DashboardPage = lazyRetry(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })))
const LandingPage = lazyRetry(() => import("@/pages/LandingPage").then((m) => ({ default: m.LandingPage })))
const AnalyticsPage = lazyRetry(() => import("@/pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })))
const ProjectsPage = lazyRetry(() => import("@/pages/ProjectsPage").then((m) => ({ default: m.ProjectsPage })))
const CreateProjectPage = lazyRetry(() => import("@/pages/CreateProjectPage").then((m) => ({ default: m.CreateProjectPage })))
const ProjectDetailPage = lazyRetry(() => import("@/pages/ProjectDetailPage").then((m) => ({ default: m.ProjectDetailPage })))
const MyProjectsPage = lazyRetry(() => import("@/pages/MyProjectsPage").then((m) => ({ default: m.MyProjectsPage })))
const MyApplicationsPage = lazyRetry(() => import("@/pages/MyApplicationsPage").then((m) => ({ default: m.MyApplicationsPage })))
const ContractsPage = lazyRetry(() => import("@/pages/ContractsPage").then((m) => ({ default: m.ContractsPage })))
const MilestonesPage = lazyRetry(() => import("@/pages/MilestonesPage").then((m) => ({ default: m.MilestonesPage })))
const EscrowPage = lazyRetry(() => import("@/pages/EscrowPage").then((m) => ({ default: m.EscrowPage })))
const DisputesPage = lazyRetry(() => import("@/pages/DisputesPage").then((m) => ({ default: m.DisputesPage })))
const ActivityPage = lazyRetry(() => import("@/pages/ActivityPage").then((m) => ({ default: m.ActivityPage })))
const ProfilePage = lazyRetry(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })))
const WalletPage = lazyRetry(() => import("@/pages/WalletPage").then((m) => ({ default: m.WalletPage })))
const SettingsPage = lazyRetry(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })))
const NotificationsPage = lazyRetry(() => import("@/pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage })))
const TransactionsPage = lazyRetry(() => import("@/pages/TransactionsPage").then((m) => ({ default: m.TransactionsPage })))
const HelpCenterPage = lazyRetry(() => import("@/pages/HelpCenterPage").then((m) => ({ default: m.HelpCenterPage })))
const ChatPage = lazyRetry(() => import("@/pages/ChatPage").then((m) => ({ default: m.ChatPage })))
const AdminDashboardPage = lazyRetry(() => import("@/pages/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage })))
const NotFoundPage = lazyRetry(() => import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })))
const LoginPage = lazyRetry(() => import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazyRetry(() => import("@/pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazyRetry(() => import("@/pages/auth/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazyRetry(() => import("@/pages/auth/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })))
const VerifyEmailPage = lazyRetry(() => import("@/pages/auth/VerifyEmailPage").then((m) => ({ default: m.VerifyEmailPage })))
const AuthCallbackPage = lazyRetry(() => import("@/pages/auth/AuthCallbackPage").then((m) => ({ default: m.AuthCallbackPage })))
const SelectRolePage = lazyRetry(() => import("@/pages/auth/SelectRolePage").then((m) => ({ default: m.SelectRolePage })))
const TermsPage = lazyRetry(() => import("@/pages/legal/TermsPage").then((m) => ({ default: m.TermsPage })))
const PrivacyPage = lazyRetry(() => import("@/pages/legal/PrivacyPage").then((m) => ({ default: m.PrivacyPage })))

function PageFallback() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

function RoleHome() {
  const { user } = useAuth()
  return user?.role === "admin" ? <Navigate to="/admin" replace /> : <DashboardPage />
}

/**
 * Public home: authenticated users go straight to their dashboard;
 * everyone else sees the public landing page.
 */
function PublicHome() {
  const { status } = useAuth()
  if (status === "authenticated") return <Navigate to="/dashboard" replace />
  return <LandingPage />
}

/**
 * Standalone Help Center route handler.
 * Unauthenticated visitors see the Help Center wrapped with LandingHeader & LandingFooter.
 * Authenticated users in AppLayout see HelpCenterPage directly inside the app shell.
 */
function PublicHelpCenter() {
  return (
    <div className="min-h-screen bg-base text-foreground flex flex-col justify-between">
      <LandingHeader />
      <main className="flex-1 pt-20 pb-16">
        <HelpCenterPage />
      </main>
      <LandingFooter />
    </div>
  )
}

/**
 * Smart Help Center route handler:
 * Renders HelpCenterPage inside AppLayout if authenticated;
 * renders PublicHelpCenter with LandingHeader/Footer for guests.
 */
function SmartHelpPage() {
  const { status } = useAuth()
  if (status === "authenticated") {
    return (
      <AppLayout>
        <RouteErrorBoundary featureName="Help Center">
          <HelpCenterPage />
        </RouteErrorBoundary>
      </AppLayout>
    )
  }
  return <PublicHelpCenter />
}

/**
 * App root: global providers + code-split route table.
 */
export function App() {
  useEffect(() => {
    setupGlobalErrorListeners()
    // H-3R: Clear chunk retry flag on successful app mount
    sessionStorage.removeItem("chunk_reload_attempted")
  }, [])

  return (
    <GlobalErrorBoundary>
      <ThemeProvider>
        <CurrencyProvider>
          <ToastProvider>
            <AuthProvider>
              <WalletProvider>
                <ScrollToTop />
                <AiAssistantDrawer />
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    {/* Public landing page — visible to unauthenticated visitors */}
                    <Route index element={<PublicHome />} />

                    {/* Auth routes render standalone */}
                    <Route path="login" element={<LoginPage />} />
                    <Route path="register" element={<RegisterPage />} />
                    <Route path="forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="reset-password" element={<ResetPasswordPage />} />
                    <Route path="verify-email" element={<VerifyEmailPage />} />
                    <Route path="auth/callback" element={<AuthCallbackPage />} />
                    <Route path="auth/select-role" element={<SelectRolePage />} />

                    {/* Public Legal Pages */}
                    <Route path="terms" element={<TermsPage />} />
                    <Route path="privacy" element={<PrivacyPage />} />

                    {/* Protected Application shell for authenticated users */}
                    <Route
                      element={
                        <ProtectedRoute>
                          <AppLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route path="dashboard" element={<RouteErrorBoundary featureName="Dashboard"><RoleHome /></RouteErrorBoundary>} />
                      <Route path="analytics" element={<RouteErrorBoundary featureName="Analytics"><AnalyticsPage /></RouteErrorBoundary>} />
                      <Route path="projects" element={<RouteErrorBoundary featureName="Projects"><ProjectsPage /></RouteErrorBoundary>} />
                      <Route path="projects/new" element={<ProtectedRoute requiredRole="client"><RouteErrorBoundary featureName="Create Project"><CreateProjectPage /></RouteErrorBoundary></ProtectedRoute>} />
                      <Route path="projects/mine" element={<RouteErrorBoundary featureName="My Projects"><MyProjectsPage /></RouteErrorBoundary>} />
                      <Route path="applications" element={<ProtectedRoute requiredRole="freelancer"><RouteErrorBoundary featureName="Applications"><MyApplicationsPage /></RouteErrorBoundary></ProtectedRoute>} />
                      <Route path="projects/:id" element={<RouteErrorBoundary featureName="Project Details"><ProjectDetailPage /></RouteErrorBoundary>} />
                      <Route path="contracts" element={<RouteErrorBoundary featureName="Contracts"><ContractsPage /></RouteErrorBoundary>} />
                      <Route path="milestones" element={<RouteErrorBoundary featureName="Milestones"><MilestonesPage /></RouteErrorBoundary>} />
                      <Route path="escrow" element={<RouteErrorBoundary featureName="Escrow"><EscrowPage /></RouteErrorBoundary>} />
                      <Route path="disputes" element={<RouteErrorBoundary featureName="Disputes"><DisputesPage /></RouteErrorBoundary>} />
                      <Route path="activity" element={<RouteErrorBoundary featureName="Activity"><ActivityPage /></RouteErrorBoundary>} />
                      <Route path="profile" element={<RouteErrorBoundary featureName="Profile"><ProfilePage /></RouteErrorBoundary>} />
                      <Route path="wallet" element={<RouteErrorBoundary featureName="Wallet"><WalletPage /></RouteErrorBoundary>} />
                      <Route path="settings" element={<RouteErrorBoundary featureName="Settings"><SettingsPage /></RouteErrorBoundary>} />
                      <Route path="notifications" element={<RouteErrorBoundary featureName="Notifications"><NotificationsPage /></RouteErrorBoundary>} />
                      <Route path="transactions" element={<RouteErrorBoundary featureName="Transactions"><TransactionsPage /></RouteErrorBoundary>} />
                      <Route path="chat" element={<RouteErrorBoundary featureName="Chat"><ChatPage /></RouteErrorBoundary>} />
                      <Route path="admin" element={<ProtectedRoute requiredRole="admin"><RouteErrorBoundary featureName="Admin"><AdminDashboardPage /></RouteErrorBoundary></ProtectedRoute>} />
                      <Route path="admin/*" element={<ProtectedRoute requiredRole="admin"><RouteErrorBoundary featureName="Admin"><AdminDashboardPage /></RouteErrorBoundary></ProtectedRoute>} />
                    </Route>

                    {/* Smart Help Center: authed visitors get app shell; guests get public landing shell */}
                    <Route path="help" element={<SmartHelpPage />} />

                    {/* Global 404 handler for all unknown routes */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </WalletProvider>
            </AuthProvider>
          </ToastProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  )
}
