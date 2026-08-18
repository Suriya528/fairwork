import { Navigate, Routes, Route } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { ToastProvider } from "@/components/ui/Toast"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { CurrencyProvider } from "@/context/CurrencyContext"
import { ScrollToTop } from "@/components/common/ScrollToTop"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { DashboardPage } from "@/pages/DashboardPage"
import { LandingPage } from "@/pages/LandingPage"
import { AnalyticsPage } from "@/pages/AnalyticsPage"
import { ProjectsPage } from "@/pages/ProjectsPage"
import { CreateProjectPage } from "@/pages/CreateProjectPage"
import { ProjectDetailPage } from "@/pages/ProjectDetailPage"
import { MyProjectsPage } from "@/pages/MyProjectsPage"
import { ContractsPage } from "@/pages/ContractsPage"
import { MilestonesPage } from "@/pages/MilestonesPage"
import { EscrowPage } from "@/pages/EscrowPage"
import { DisputesPage } from "@/pages/DisputesPage"
import { ActivityPage } from "@/pages/ActivityPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { SettingsPage } from "@/pages/SettingsPage"
import { HelpCenterPage } from "@/pages/HelpCenterPage"
import { ChatPage } from "@/pages/ChatPage"
import { AdminDashboardPage } from "@/pages/AdminDashboardPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"

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
 * Public & Authenticated Help Center Route Handler.
 * Unauthenticated visitors see the Help Center inside the public marketplace shell.
 * Authenticated users see the Help Center inside the AppLayout application shell.
 */
function HelpRouteHandler() {
  const { status } = useAuth()
  if (status === "authenticated") {
    return <HelpCenterPage />
  }
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
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <ToastProvider>
          <AuthProvider>
            <ScrollToTop />
            <Routes>
              {/* Public landing page — visible to unauthenticated visitors */}
              <Route index element={<PublicHome />} />

              {/* Public Help Center route — accessible to logged-out and logged-in visitors */}
              <Route path="help" element={<HelpRouteHandler />} />

              {/* Auth routes render standalone */}
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<RoleHome />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/new" element={<CreateProjectPage />} />
                <Route path="projects/mine" element={<MyProjectsPage />} />
                <Route path="projects/:id" element={<ProjectDetailPage />} />
                <Route path="contracts" element={<ContractsPage />} />
                <Route path="milestones" element={<MilestonesPage />} />
                <Route path="escrow" element={<EscrowPage />} />
                <Route path="disputes" element={<DisputesPage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="admin/users" element={<ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="admin/projects" element={<ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="admin/disputes" element={<ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="admin/system" element={<ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </CurrencyProvider>
    </ThemeProvider>
  )
}
