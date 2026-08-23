import { apiFetch } from "./apiClient"

export interface PortfolioItem {
  _id?: string
  title: string
  description: string
  imageUrl?: string
  projectUrl?: string
  githubUrl?: string
  tags?: string[]
}

export interface UserStats {
  totalEarnedUSDC: number
  totalSpentUSDC: number
  completedProjectsCount: number
  completedMilestonesCount: number
  ratingCounts: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export interface WorkHistoryItem {
  id: string
  title: string
  category: string
  budget: number
  milestonesCount: number
  escrowTxnHash: string
  etherscanUrl: string | null
  completedAt: string
}

export interface UserProfileDTO {
  user: {
    id: string
    name: string
    firstName: string
    lastName: string
    role: string
    walletAddress?: string
    bio?: string
    tagline?: string
    hourlyRate?: number
    availability?: "available" | "busy" | "not_available"
    skills?: string[]
    avatarUrl?: string
    bannerUrl?: string
    githubUrl?: string
    linkedinUrl?: string
    portfolio?: string
    portfolioItems?: PortfolioItem[]
    reputationScore: number
    totalReviews: number
    createdAt?: string
  }
  stats: UserStats
  workHistory: WorkHistoryItem[]
  reviews: Array<{
    _id: string
    rating: number
    comment: string
    reviewerId?: { firstName: string; lastName: string; avatarUrl?: string }
    createdAt: string
  }>
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
    email?: string
    firstName?: string
    lastName?: string
    bio?: string
    tagline?: string
    hourlyRate?: number
    availability?: "available" | "busy" | "not_available"
    skills?: string[]
    avatarUrl?: string
    bannerUrl?: string
    githubUrl?: string
    linkedinUrl?: string
    portfolio?: string
    portfolioItems?: PortfolioItem[]
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
