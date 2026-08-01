import { useEffect, useState } from "react"

/**
 * Briefly reports `loading = true` on mount, then flips to `false`.
 *
 * This lets the dashboard exercise its skeleton/loading states with the
 * current dummy data. When a real API is wired up, swap callers over to the
 * data-fetching library's `isLoading` flag — the component contracts stay
 * identical.
 */
export function useSimulatedLoading(delay = 650): boolean {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), delay)
    return () => window.clearTimeout(timer)
  }, [delay])

  return loading
}
