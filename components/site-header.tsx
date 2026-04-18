"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/store/useAuth"
import { ThemeToggle } from "./ThemeToggle"

const roleTitles: Record<string, string> = {
  ADMIN: "Smart Surveillance System",
  ADMINISTRATOR: "Admin Panel",
  BRAND: "Brand Management Center",
  PROFESSIONAL: "Professional Dashboard",
  ARTISAN: "Artisan Dashboard",
}

export function SiteHeader() {
  const { user } = useAuth()
  const title = roleTitles[user?.role || ""] || "Dashboard"

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
