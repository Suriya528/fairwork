import { Routes, Route } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { ToastProvider } from "@/components/ui/Toast"
import { AuthProvider } from "@/context/AuthContext"
import { DashboardPage } from "@/pages/DashboardPage"
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

/**
 * App root: global providers + the route table.
 * All primary routes render inside the AppLayout shell (sidebar + topbar),
 * gated behind ProtectedRoute so a valid session is required.
 */
export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          {/* Auth routes render standalone (no app shell) */}
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
            <Route index element={<DashboardPage />} />
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
            <Route path="help" element={<HelpCenterPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  )
}
