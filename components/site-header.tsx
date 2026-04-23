"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/store/useAuth"
import { ThemeToggle } from "./ThemeToggle"
import { usePathname } from "next/navigation"

const routeTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/analytics": "Performance Metrics",
  "/dashboard/tracking": "Live Device Map",
}

const roleTitles: Record<string, string> = {
  ADMIN: "SecureSurv",
  ADMINISTRATOR: "SecureSurv",
  BRAND: "SecureSurv",
  PROFESSIONAL: "SecureSurv",
  ARTISAN: "SecureSurv",
}

export function SiteHeader() {
  const { user } = useAuth()
  const pathname = usePathname() // [!code ++]

  const getPageTitle = () => {
    if (routeTitles[pathname]) return routeTitles[pathname]

    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) return "SecureSurv"

    const lastSegment = segments[segments.length - 1]

    // Convert "device-tracking" to "Device Tracking"
    return lastSegment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const title = getPageTitle()

  // const title = roleTitles[user?.role || ""] || "Dashboard"

  return (
    <header className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 h-4" />
        <div className="w-full">
          <span className="hidden text-sm font-medium sm:block">{title}</span>
        </div>
        <div className="flex w-full justify-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
