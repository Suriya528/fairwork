import { apiFetch } from "./apiClient"

export interface UserProfileDTO {
  user: {
    id: string
    name: string
    firstName: string
    lastName: string
    role: string
    walletAddress?: string
    bio?: string
    skills?: string[]
    avatarUrl?: string
    githubUrl?: string
    linkedinUrl?: string
    portfolio?: string
    reputationScore: number
    totalReviews: number
    createdAt?: string
  }
  completedProjectsCount: number
  reviews: Array<{
    _id: string
    rating: number
    comment: string
    reviewerId?: { firstName: string; lastName: string; avatarUrl?: string }
    createdAt: string
  }>
  verifiedMilestonesCompleted: number
}

export interface NotificationPreferences {
  escrowDeposits: boolean
  milestoneReleases: boolean
  chatMessages: boolean
  disputeAlerts: boolean
  emailNotifications: boolean
}

export async function getPublicProfile(userId: string): Promise<UserProfileDTO> {
  return apiFetch<UserProfileDTO>(`/users/profile/${userId}`)
}

export async function updateProfile(
  data: {
    firstName?: string
    lastName?: string
    bio?: string
    skills?: string[]
    avatarUrl?: string
    githubUrl?: string
    linkedinUrl?: string
    portfolio?: string
  },
  token: string,
) {
  return apiFetch<{ message: string; user: unknown }>("/users/profile", {
    method: "PUT",
    token,
    body: data,
  })
}

export async function updatePreferences(
  notificationPreferences: Partial<NotificationPreferences>,
  token: string,
) {
  return apiFetch<{ message: string; notificationPreferences: NotificationPreferences }>(
    "/users/preferences",
    {
      method: "PUT",
      token,
      body: { notificationPreferences },
    },
  )
}
