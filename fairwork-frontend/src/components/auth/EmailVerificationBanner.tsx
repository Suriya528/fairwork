import { useAuth } from "@/context/AuthContext"
import { useNavigate, useLocation } from "react-router-dom"

/**
 * Contextual Verification Controller
 * Suppresses legacy persistent banner clutter across dashboard/projects to maintain a clean UI.
 * Contextual Action Lockout Modals (VerificationRequiredModal) and AccountMenu badges handle user guidance on trigger.
 */
export function EmailVerificationBanner() {
  const { user } = useAuth()
  const location = useLocation()
  void location
  void useNavigate

  if (!user || user.isEmailVerified) {
    return null
  }

  // Clean UI: Return null to suppress full-screen persistent banner clutter.
  return null
}
