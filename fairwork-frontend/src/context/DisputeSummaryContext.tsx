import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useAuth } from "@/context/AuthContext"
import { getDispute, type ApiDispute } from "@/services/disputesApi"
import { getMyProjects, type ApiProject } from "@/services/projectsApi"

interface DisputeSummaryValue {
  projects: ApiProject[]
  disputes: ApiDispute[]
  openDisputeCount: number
  loading: boolean
  error: string
  refresh: () => Promise<void>
}

const DisputeSummaryContext = createContext<DisputeSummaryValue | undefined>(undefined)

export function DisputeSummaryProvider({ children }: { children: ReactNode }) {
  const { token, status } = useAuth()
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [disputes, setDisputes] = useState<ApiDispute[]>([])
  const [openDisputeCount, setOpenDisputeCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    if (status !== "authenticated" || !token) {
      setProjects([])
      setDisputes([])
      setOpenDisputeCount(0)
      setError("")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    try {
      const userProjects = await getMyProjects(token)
      const found = await Promise.all(
        userProjects
          .filter((project) => project.status === "disputed")
          .map((project) => getDispute(project.id, token)),
      )
      const userDisputes = found.filter((dispute): dispute is ApiDispute => Boolean(dispute))

      setProjects(userProjects)
      setDisputes(userDisputes)
      setOpenDisputeCount(userDisputes.filter((dispute) => dispute.status === "pending").length)
    } catch (cause) {
      setProjects([])
      setDisputes([])
      setOpenDisputeCount(0)
      setError(cause instanceof Error ? cause.message : "Unable to load disputes.")
    } finally {
      setLoading(false)
    }
  }, [status, token])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <DisputeSummaryContext.Provider value={{ projects, disputes, openDisputeCount, loading, error, refresh }}>
      {children}
    </DisputeSummaryContext.Provider>
  )
}

export function useDisputeSummary() {
  const context = useContext(DisputeSummaryContext)
  if (!context) throw new Error("useDisputeSummary must be used within DisputeSummaryProvider")
  return context
}
