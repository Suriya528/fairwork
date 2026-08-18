import { useEffect } from "react"
import { useLocation } from "react-router-dom"

/**
 * Global Scroll Restoration component.
 * Ensures every new page navigation (e.g. footer -> /help) immediately resets
 * window scroll position to the top (window.scrollY = 0).
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
