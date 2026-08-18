import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type ThemeMode = "light" | "dark"

interface ThemeContextType {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const STORAGE_KEY = "fairwork-theme"

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === "light" || stored === "dark") {
        return stored
      }
    } catch {
      // Fallback on storage errors
    }
    return "dark" // Default FairWork dark visual identity
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === "light") {
      root.classList.add("light")
      root.classList.remove("dark")
      root.setAttribute("data-theme", "light")
    } else {
      root.classList.add("dark")
      root.classList.remove("light")
      root.setAttribute("data-theme", "dark")
    }

    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Fallback on storage errors
    }
  }, [theme])

  const setTheme = (next: ThemeMode) => {
    setThemeState(next)
  }

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
