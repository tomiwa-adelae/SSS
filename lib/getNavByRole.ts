import {
  IconLayoutDashboard,
  IconCamera,
  IconFaceId,
  IconListDetails,
  IconBell,
  IconChartBar,
  IconDevices,
  IconUsersGroup,
} from "@tabler/icons-react"
import type { Icon } from "@tabler/icons-react"

interface NavItem {
  label: string
  slug: string
  icon?: Icon
  comingSoon?: boolean
}

const sssNavItems: NavItem[] = [
  { label: "Dashboard", slug: "/dashboard", icon: IconLayoutDashboard },
  { label: "Cameras", slug: "/dashboard/cameras", icon: IconCamera },
  {
    label: "Face Database",
    slug: "/dashboard/face-database",
    icon: IconFaceId,
  },
  {
    label: "Detection Logs",
    slug: "/dashboard/detection-logs",
    icon: IconListDetails,
  },
  { label: "Alerts", slug: "/dashboard/alerts", icon: IconBell },
  { label: "Analytics", slug: "/dashboard/analytics", icon: IconChartBar },
  {
    label: "Device Tracking",
    slug: "/dashboard/device-tracking",
    icon: IconDevices,
  },
  {
    label: "Admin Management",
    slug: "/dashboard/admins",
    icon: IconUsersGroup,
  },
]

export function getNavByRole(
  user: { role?: string | null } | null | undefined
): NavItem[] {
  return sssNavItems
}
