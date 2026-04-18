"use client"

import * as React from "react"
import { IconCamera, IconSettings, IconHelp } from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/store/useAuth"
import { getNavByRole } from "@/lib/getNavByRole"

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const navItems = React.useMemo(() => getNavByRole(user), [user])

  const navSecondary = React.useMemo(
    () => [
      { title: "Settings", url: "/dashboard/settings", icon: IconSettings },
      { title: "Get Help", url: "/help", icon: IconHelp, comingSoon: true },
    ],
    [],
  )

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
              <a href="/dashboard">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                  <IconCamera className="size-5" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-bold">SSS</span>
                  <span className="text-xs text-muted-foreground">Surveillance</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
