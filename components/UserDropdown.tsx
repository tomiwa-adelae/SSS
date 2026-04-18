"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSignout } from "@/hooks/use-signout"
import {
  IconBell,
  IconBookmark,
  IconBuildingSkyscraper,
  IconCalendar,
  IconChevronDown,
  IconClipboardList,
  IconLayoutDashboard,
  IconLogout,
  IconShieldFilled,
} from "@tabler/icons-react"
import { DEFAULT_PROFILE_IMAGE } from "@/constants"
import { useAuth } from "@/store/useAuth"

export function UserDropdown() {
  const { user } = useAuth()
  const handleSignout = useSignout()

  if (!user) return null

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()

  const dashboardHref =
    user.role === "ADMIN"
      ? "/admin/dashboard"
      : user.role === "LANDLORD"
      ? "/landlord/dashboard"
      : "/dashboard"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto gap-2 p-0 hover:bg-transparent">
          <Avatar className="size-8">
            <AvatarImage
              src={user.image ?? DEFAULT_PROFILE_IMAGE}
              alt={`${user.firstName ?? "User"} avatar`}
              className="size-full object-cover"
            />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <IconChevronDown size={14} className="text-white opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {user.firstName} {user.lastName}
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={dashboardHref}>
              <IconLayoutDashboard size={15} className="opacity-60" />
              <span>My Dashboard</span>
            </Link>
          </DropdownMenuItem>

          {/* CLIENT-specific quick links */}
          {user.role === "CLIENT" && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/saved">
                  <IconBookmark size={15} className="opacity-60" />
                  <span>Saved Listings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/applications">
                  <IconClipboardList size={15} className="opacity-60" />
                  <span>My Applications</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/bookings">
                  <IconCalendar size={15} className="opacity-60" />
                  <span>My Bookings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/notifications">
                  <IconBell size={15} className="opacity-60" />
                  <span>Notifications</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {/* LANDLORD-specific quick links */}
          {user.role === "LANDLORD" && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/landlord/listings">
                  <IconBuildingSkyscraper size={15} className="opacity-60" />
                  <span>My Listings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/landlord/notifications">
                  <IconBell size={15} className="opacity-60" />
                  <span>Notifications</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>

        {/* Admin panel link */}
        {user.role === "ADMIN" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/admin/dashboard">
                  <IconShieldFilled size={15} className="opacity-60" />
                  <span>Admin Panel</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignout} className="text-red-600 focus:text-red-600">
          <IconLogout size={15} className="opacity-60" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
