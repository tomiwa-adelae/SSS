"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  IconCamera,
  IconUser,
  IconShield,
  IconScan,
  IconBell,
  IconBellExclamation,
  IconUsers,
} from "@tabler/icons-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/PageHeader"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useAuth } from "@/store/useAuth"
import { env } from "@/lib/env"

type Summary = {
  total_cameras: number
  active_cameras: number
  total_wanted_persons: number
  total_persons: number
  total_detections: number
  total_alerts: number
  unread_alerts: number
}

type TrendPoint = { date: string; count: number }
type HourlyPoint = { hour: string; count: number }
type CameraActivity = {
  camera_id: number
  name: string
  location: string
  detections: number
}
type TopPerson = { person_id: number; name: string; detections: number }

const trendConfig = {
  count: {
    label: "Detections",
    color: "var(--primary)", // Simplified reference
  },
}

const hourlyConfig = {
  count: {
    label: "Detections",
    color: "var(--primary)",
  },
}
export default function AnalyticsPage() {
  const { token } = useAuth()

  const [summary, setSummary] = useState<Summary | null>(null)
  const [trends, setTrends] = useState<TrendPoint[]>([])
  const [hourly, setHourly] = useState<HourlyPoint[]>([])
  const [cameras, setCameras] = useState<CameraActivity[]>([])
  const [topPersons, setTopPersons] = useState<TopPerson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      const headers = { Authorization: `Token ${token}` }
      const base = env.NEXT_PUBLIC_BACKEND_API_URL

      try {
        const [summaryRes, trendsRes, hourlyRes, cameraRes, personsRes] =
          await Promise.all([
            fetch(`${base}/api/analytics/summary/`, { headers }),
            fetch(`${base}/api/analytics/trends/?days=30`, { headers }),
            fetch(`${base}/api/analytics/hourly/?days=7`, { headers }),
            fetch(`${base}/api/analytics/camera-activity/`, { headers }),
            fetch(`${base}/api/analytics/top-persons/?limit=5`, { headers }),
          ])

        if (summaryRes.ok) setSummary(await summaryRes.json())
        else toast.error("Failed to load summary.")

        if (trendsRes.ok) setTrends(await trendsRes.json())
        if (hourlyRes.ok) setHourly(await hourlyRes.json())
        if (cameraRes.ok) setCameras(await cameraRes.json())
        if (personsRes.ok) setTopPersons(await personsRes.json())
      } catch {
        toast.error("Failed to load analytics data.")
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [token])

  const statCards = summary
    ? [
        {
          label: "Total Cameras",
          value: summary.total_cameras,
          icon: IconCamera,
        },
        {
          label: "Active Cameras",
          value: summary.active_cameras,
          icon: IconCamera,
          highlight: true,
        },
        {
          label: "Total Persons",
          value: summary.total_persons,
          icon: IconUsers,
        },
        {
          label: "Wanted Persons",
          value: summary.total_wanted_persons,
          icon: IconShield,
          alert: true,
        },
        {
          label: "Total Detections",
          value: summary.total_detections,
          icon: IconScan,
        },
        {
          label: "Total Alerts",
          value: summary.total_alerts,
          icon: IconBell,
        },
        {
          label: "Unread Alerts",
          value: summary.unread_alerts,
          icon: IconBellExclamation,
          alert: summary.unread_alerts > 0,
        },
      ]
    : []

  const maxCameraDetections = Math.max(...cameras.map((c) => c.detections), 1)
  const maxPersonDetections = Math.max(
    ...topPersons.map((p) => p.detections),
    1
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="System-wide surveillance statistics and trends"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="mb-2 h-8 w-12" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))
          : statCards.map(({ label, value, icon: Icon, alert, highlight }) => (
              <Card
                key={label}
                className={
                  alert ? "border-orange-500/40 dark:border-orange-500/30" : ""
                }
              >
                <CardContent className="p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <p
                      className={`text-3xl font-bold ${alert ? "text-orange-500" : highlight ? "text-primary" : ""}`}
                    >
                      {value}
                    </p>
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Detection Trends (30 days) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Detection Trends — Last 30 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : trends.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No trend data available.
              </p>
            </div>
          ) : (
            <ChartContainer config={trendConfig} className="h-48 w-full">
              <AreaChart
                data={trends}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="trendGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v) => format(new Date(v), "MMM d")}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  allowDecimals={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#trendGradient)"
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Hourly + Camera/Person tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hourly Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Hourly Activity — Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : hourly.length === 0 ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No hourly data available.
                </p>
              </div>
            ) : (
              <ChartContainer config={hourlyConfig} className="h-48 w-full">
                <BarChart
                  data={hourly}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(v) => format(new Date(v), "HH:mm")}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                    allowDecimals={false}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(v) =>
                          format(new Date(v), "MMM d, HH:mm")
                        }
                      />
                    }
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--primary)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Camera Activity + Top Persons stacked */}
        <div className="space-y-6">
          {/* Camera Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Camera Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-2 flex-1" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              ) : cameras.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No camera data.
                </p>
              ) : (
                <div className="space-y-3">
                  {cameras.map((cam) => (
                    <div key={cam.camera_id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-medium">{cam.name}</span>
                          <span className="ml-1 text-muted-foreground">
                            · {cam.location}
                          </span>
                        </div>
                        <span className="font-mono font-medium">
                          {cam.detections}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${(cam.detections / maxCameraDetections) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Persons */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Top Detected Persons
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-2 flex-1" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              ) : topPersons.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No person data.
                </p>
              ) : (
                <div className="space-y-3">
                  {topPersons.map((person, i) => (
                    <div key={person.person_id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">
                            #{i + 1}
                          </span>
                          <span className="font-medium">{person.name}</span>
                        </div>
                        <span className="font-mono font-medium">
                          {person.detections}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${(person.detections / maxPersonDetections) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
