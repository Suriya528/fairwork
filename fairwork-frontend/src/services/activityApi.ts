import { apiFetch } from "./apiClient"

export interface ApiActivity {
  id: string
  type: string
  title: string
  message: string
  projectId: string | null
  disputeId: string | null
  milestoneIndex: number | null
  read: boolean
  createdAt: string
}

interface BackendActivity extends Omit<ApiActivity, "id"> { _id: string }
interface ActivityResponse { activities: BackendActivity[]; pagination: { page: number; limit: number; total: number; hasMore: boolean } }

export async function getActivities(token: string, page = 1, limit = 20) {
  const data = await apiFetch<ActivityResponse>(`/activity?page=${page}&limit=${limit}`, { token })
  return { ...data, activities: data.activities.map(({ _id, ...activity }) => ({ id: _id, ...activity })) }
}

export async function markActivitiesRead(ids: string[], token: string) {
  return apiFetch<{ updated: number }>("/activity/read", { method: "PATCH", token, body: { ids } })
}
