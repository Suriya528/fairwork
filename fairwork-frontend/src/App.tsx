import { useEffect } from "react"
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
import { DashboardPage } from "@/pages/DashboardPage"
import { LandingPage } from "@/pages/LandingPage"
import { AnalyticsPage } from "@/pages/AnalyticsPage"
import { ProjectsPage } from "@/pages/ProjectsPage"
import { CreateProjectPage } from "@/pages/CreateProjectPage"
import { ProjectDetailPage } from "@/pages/ProjectDetailPage"
import { MyProjectsPage } from "@/pages/MyProjectsPage"
import { MyApplicationsPage } from "@/pages/MyApplicationsPage"
import { ContractsPage } from "@/pages/ContractsPage"
import { MilestonesPage } from "@/pages/MilestonesPage"
import { EscrowPage } from "@/pages/EscrowPage"
import { DisputesPage } from "@/pages/DisputesPage"
import { ActivityPage } from "@/pages/ActivityPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { WalletPage } from "@/pages/WalletPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { NotificationsPage } from "@/pages/NotificationsPage"
import { TransactionsPage } from "@/pages/TransactionsPage"
import { HelpCenterPage } from "@/pages/HelpCenterPage"
import { ChatPage } from "@/pages/ChatPage"
import { AdminDashboardPage } from "@/pages/AdminDashboardPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { AuthCallbackPage } from "@/pages/auth/AuthCallbackPage"
import { SelectRolePage } from "@/pages/auth/SelectRolePage"

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
 * App root: global providers + the route table.
 */
export function App() {
  useEffect(() => {
    setupGlobalErrorListeners()
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
                <Routes>
                {/* Public landing page — visible to unauthenticated visitors */}
                <Route index element={<PublicHome />} />

                {/* Auth routes render standalone */}
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="auth/callback" element={<AuthCallbackPage />} />
                <Route path="auth/select-role" element={<SelectRolePage />} />

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
                  <Route path="help" element={<RouteErrorBoundary featureName="Help Center"><HelpCenterPage /></RouteErrorBoundary>} />
                  <Route path="chat" element={<RouteErrorBoundary featureName="Chat"><ChatPage /></RouteErrorBoundary>} />
                  <Route path="admin" element={<ProtectedRoute requiredRole="admin"><RouteErrorBoundary featureName="Admin"><AdminDashboardPage /></RouteErrorBoundary></ProtectedRoute>} />
                  <Route path="admin/*" element={<ProtectedRoute requiredRole="admin"><RouteErrorBoundary featureName="Admin"><AdminDashboardPage /></RouteErrorBoundary></ProtectedRoute>} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* Standalone Public Help Center route for logged-out visitors */}
                <Route path="help" element={<PublicHelpCenter />} />
              </Routes>
            </WalletProvider>
          </AuthProvider>
          </ToastProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  )
}
