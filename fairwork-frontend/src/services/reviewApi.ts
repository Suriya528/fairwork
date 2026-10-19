import { apiFetch } from "./apiClient"

export interface ApiProjectReviewResponse {
  hasReviewed: boolean
  review: {
    _id: string
    projectId: string
    reviewerId: string
    revieweeId: string
    rating: number
    comment: string
    createdAt: string
  } | null
}

export async function checkProjectReview(projectId: string, token: string): Promise<ApiProjectReviewResponse> {
  return apiFetch<ApiProjectReviewResponse>(`/reviews/project/${projectId}`, { token })
}
