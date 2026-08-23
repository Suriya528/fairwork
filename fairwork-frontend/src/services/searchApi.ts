import { apiFetch } from "./apiClient"

export interface SearchResultProject {
  id: string
  title: string
  category: string
  description: string
  budget: number
  status: string
  clientName: string
}

export interface SearchResultUser {
  id: string
  name: string
  email: string
  role: string
  skills: string[]
  bio: string
  walletAddress: string
}

export interface SearchResultWallet {
  id: string
  name: string
  type: string
  address: string
  network: string
}

export interface SearchResultPage {
  id: string
  title: string
  category: string
  path: string
  icon: string
}

export interface GlobalSearchResponse {
  query: string
  projects: SearchResultProject[]
  users: SearchResultUser[]
  wallets: SearchResultWallet[]
  pages: SearchResultPage[]
}

export async function searchGlobal(query: string, token: string): Promise<GlobalSearchResponse> {
  if (!query.trim()) {
    return { query: "", projects: [], users: [], wallets: [], pages: [] }
  }
  const params = new URLSearchParams({ q: query.trim() })
  return apiFetch<GlobalSearchResponse>(`/search?${params.toString()}`, { token })
}
