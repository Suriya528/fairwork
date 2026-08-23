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

export interface GithubIdentityDTO {
  githubUserId: string
  username: string
  avatarUrl: string
  profileUrl: string
  connectedAt?: string
  visibility: "PUBLIC" | "PRIVATE"
}

export interface GithubContributionDay {
  contributionCount: number
  date: string
  color: string
}

export interface GithubContributionWeek {
  contributionDays: GithubContributionDay[]
}

export interface GithubActivityDTO {
  identity: GithubIdentityDTO
  activity: {
    contributionCalendar: {
      totalContributions: number
      weeks: GithubContributionWeek[]
    }
    topLanguages: Array<{ name: string; color: string; percentage: number }>
    topRepositories: Array<{
      name: string
      description: string
      stars: number
      forks: number
      url: string
      language?: string
    }>
    longestStreak: number
    currentStreak: number
    totalContributionsYear: number
  }
}

export async function getGithubActivity(userId: string, token?: string): Promise<GithubActivityDTO> {
  return apiFetch<GithubActivityDTO>(`/users/${userId}/github-activity`, { token })
}

export async function disconnectGithub(token: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/users/github/disconnect", {
    method: "DELETE",
    token,
  })
}

export async function updateGithubVisibility(
  visibility: "PUBLIC" | "PRIVATE",
  token: string,
): Promise<{ message: string; githubIdentity: GithubIdentityDTO }> {
  return apiFetch<{ message: string; githubIdentity: GithubIdentityDTO }>("/users/github/visibility", {
    method: "PATCH",
    token,
    body: { visibility },
  })
}

