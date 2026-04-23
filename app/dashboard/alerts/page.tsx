"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import Image from "next/image"
import {
  IconBell,
  IconBellOff,
  IconCamera,
  IconCheck,
  IconCheckbox,
  IconFilter,
  IconRefresh,
  IconUser,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/PageHeader"
import { useAuth } from "@/store/useAuth"
import { cn } from "@/lib/utils"
import { env } from "@/lib/env"

type Alert = {
  id: number
  message: string
  is_read: boolean
  created_at: string
  person: string
  camera: string
  confidence: number
  detection_image: string
}

type Filter = "all" | "unread" | "read"

function ConfidenceBadge({ value }: { value: number }) {
  const high = value >= 70
  const mid = value >= 50
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        high
          ? "bg-red-500/15 text-red-500"
          : mid
            ? "bg-orange-500/15 text-orange-500"
            : "bg-yellow-500/15 text-yellow-600"
      )}
    >
      {value.toFixed(1)}% confidence
    </span>
  )
}

export default function AlertsPage() {
  const { token } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [markingIds, setMarkingIds] = useState<Set<number>>(new Set())
  const [markingAll, setMarkingAll] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [])

  async function fetchAlerts() {
    setLoading(true)
    try {
      const res = await fetch(
        `${env.NEXT_PUBLIC_BACKEND_API_URL}/api/alerts/`,
        { headers: { Authorization: `Token ${token}` } }
      )
      if (!res.ok) throw new Error()
      const data = await res.json()

      console.log(data)

      setAlerts(data)
    } catch (error) {
      console.log(error)
      toast.error("Failed to load alerts.")
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: number) {
    setMarkingIds((prev) => new Set(prev).add(id))
    try {
      const res = await fetch(
        `${env.NEXT_PUBLIC_BACKEND_API_URL}/api/alerts/${id}/mark-read/`,
        {
          method: "PATCH",
          headers: { Authorization: `Token ${token}` },
        }
      )
      if (!res.ok) throw new Error()
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
      )
    } catch {
      toast.error("Failed to mark alert as read.")
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  async function markAllRead() {
    const unread = alerts.filter((a) => !a.is_read)
    if (unread.length === 0) return
    setMarkingAll(true)
    try {
      const res = await fetch(
        `${env.NEXT_PUBLIC_BACKEND_API_URL}/api/alerts/mark-all-read/`,
        {
          method: "PATCH",
          headers: { Authorization: `Token ${token}` },
        }
      )
      if (!res.ok) throw new Error()
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })))
      toast.success("All alerts marked as read.")
    } catch {
      toast.error("Failed to mark all alerts as read.")
    } finally {
      setMarkingAll(false)
    }
  }

  const filtered = alerts.filter((a) => {
    if (filter === "unread") return !a.is_read
    if (filter === "read") return a.is_read
    return true
  })

  const unreadCount = alerts.filter((a) => !a.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Alerts"
          description="Detection alerts for wanted persons spotted by cameras"
        />

        <div className="mt-1 flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAlerts}
            disabled={loading}
          >
            <IconRefresh className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <IconFilter className="size-4" />
                {filter === "all"
                  ? "All"
                  : filter === "unread"
                    ? "Unread"
                    : "Read"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={filter}
                onValueChange={(v) => setFilter(v as Filter)}
              >
                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="unread">
                  Unread only
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="read">
                  Read only
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={markAllRead}
              disabled={markingAll}
            >
              <IconCheckbox className="size-4" />
              {markingAll ? "Marking…" : "Mark all read"}
            </Button>
          )}
        </div>
      </div>

      {/* Summary strip */}
      {!loading && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{alerts.length} total</span>
          <span>·</span>
          <span
            className={cn(unreadCount > 0 && "font-medium text-orange-500")}
          >
            {unreadCount} unread
          </span>
          {filter !== "all" && (
            <>
              <span>·</span>
              <span>showing {filtered.length}</span>
            </>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex gap-4 p-4">
                <Skeleton className="size-20 shrink-0 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border bg-muted/30 py-16">
          <IconBellOff className="mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {filter === "unread"
              ? "No unread alerts."
              : filter === "read"
                ? "No read alerts."
                : "No alerts yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => {
            const isExpanded = expandedId === alert.id
            return (
              <Card
                key={alert.id}
                className={cn(
                  "transition-colors",
                  !alert.is_read && "border-orange-500/30 bg-orange-500/5"
                )}
              >
                <CardContent className="p-0">
                  <button
                    className="flex w-full items-start gap-4 p-4 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                  >
                    {/* Thumbnail */}
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={alert.detection_image}
                        alt={`Detection of ${alert.person}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!alert.is_read && (
                          <span className="size-2 shrink-0 rounded-full bg-orange-500" />
                        )}
                        <p className="truncate text-sm font-semibold">
                          {alert.person}
                        </p>
                        <ConfidenceBadge value={alert.confidence} />
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <IconCamera className="size-3" />
                          {alert.camera}
                        </span>
                        <span>
                          {format(
                            new Date(alert.created_at),
                            "MMM d, yyyy · h:mm a"
                          )}
                        </span>
                      </div>

                      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                        {alert.message}
                      </p>
                    </div>

                    <div className="ml-2 flex shrink-0 items-start gap-2">
                      {alert.is_read ? (
                        <Badge variant="secondary" className="text-xs">
                          Read
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-500 text-xs text-white hover:bg-orange-600">
                          New
                        </Badge>
                      )}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t px-4 pt-3 pb-4">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted sm:w-72">
                          <Image
                            src={alert.detection_image}
                            alt={`Detection of ${alert.person}`}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>

                        <div className="flex flex-1 flex-col gap-3">
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                              Details
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <IconUser className="size-4 text-muted-foreground" />
                              <span className="font-medium">
                                {alert.person}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <IconCamera className="size-4 text-muted-foreground" />
                              <span>{alert.camera}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <IconBell className="size-4 text-muted-foreground" />
                              <ConfidenceBadge value={alert.confidence} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(alert.created_at),
                                "EEEE, MMMM d yyyy · h:mm:ss a"
                              )}
                            </p>
                          </div>

                          {!alert.is_read && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-fit"
                              disabled={markingIds.has(alert.id)}
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(alert.id)
                              }}
                            >
                              <IconCheck className="size-4" />
                              {markingIds.has(alert.id)
                                ? "Marking…"
                                : "Mark as read"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
