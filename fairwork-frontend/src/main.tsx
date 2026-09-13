import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { App } from "@/App"
import "@/styles/globals.css"

// Bootstrap theme synchronously before React render (replaces inline script for strict CSP)
try {
  const theme = localStorage.getItem("fairwork-theme")
  if (theme === "light") {
    document.documentElement.classList.remove("dark")
    document.documentElement.classList.add("light")
    document.documentElement.setAttribute("data-theme", "light")
  } else {
    document.documentElement.classList.remove("light")
    document.documentElement.classList.add("dark")
    document.documentElement.setAttribute("data-theme", "dark")
  }
} catch {
  // Ignore localStorage access errors
}

const rootElement = document.getElementById("root")
if (!rootElement) {
  throw new Error("Root element #root not found")
}

createRoot(rootElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
