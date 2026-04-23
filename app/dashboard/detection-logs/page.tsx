"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import Image from "next/image"
import { format } from "date-fns"
import { IconScan, IconCamera, IconSearch } from "@tabler/icons-react"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { PageHeader } from "@/components/PageHeader"
import { useAuth } from "@/store/useAuth"
import { cn } from "@/lib/utils"
import { env } from "@/lib/env"

type Detection = {
  id: number
  person: string
  camera: string
  confidence: number
  image: string
  timestamp: string
}

function ConfidenceBadge({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "text-xs font-semibold",
        value > 70
          ? "text-destructive"
          : value >= 55
            ? "text-orange-500"
            : "text-yellow-600"
      )}
    >
      {value.toFixed(1)}%
    </span>
  )
}

export default function DetectionLogsPage() {
  const { token } = useAuth()
  const [detections, setDetections] = useState<Detection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Detection | null>(null)

  useEffect(() => {
    async function fetchDetections() {
      try {
        const res = await fetch(
          `${env.NEXT_PUBLIC_BACKEND_API_URL}/api/recognition/detections/`,
          { headers: { Authorization: `Token ${token}` } }
        )
        if (!res.ok) throw new Error()
        const data = await res.json()
        console.log(data)
        setDetections(data)
      } catch (error) {
        console.log(error)
        toast.error("Failed to load detection logs.")
      } finally {
        setLoading(false)
      }
    }
    fetchDetections()
  }, [token])

  const filtered = detections.filter((d) => {
    const q = search.toLowerCase()
    return (
      d.person.toLowerCase().includes(q) || d.camera.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Detection Logs"
          description="Browse all face recognition detection events"
        />
        <div className="relative mt-1 w-full shrink-0 sm:w-64">
          <IconSearch className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by person or camera…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-video w-full rounded-t-lg rounded-b-none" />
              <CardContent className="p-3">
                <Skeleton className="mb-1.5 h-4 w-3/4" />
                <Skeleton className="mb-1 h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border bg-muted/30 py-16">
          <IconScan className="mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {search
              ? "No detections match your search."
              : "No detection events recorded yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((detection) => (
            <Card
              key={detection.id}
              className="cursor-pointer gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md"
              onClick={() => setSelected(detection)}
            >
              <div className="relative aspect-video bg-muted">
                <Image
                  src={detection.image}
                  alt={`Detection of ${detection.person}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-1.5 right-1.5">
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px]"
                  >
                    #{detection.id}
                  </Badge>
                </div>
              </div>
              <CardContent className="px-3 py-3">
                <p className="truncate text-sm font-medium">
                  {detection.person}
                </p>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <IconCamera className="size-3 shrink-0" />
                  <span className="truncate">{detection.camera}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(detection.timestamp), "MMM d, HH:mm")}
                  </p>
                  <ConfidenceBadge value={detection.confidence} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogTitle className="sr-only">Detection Detail</DialogTitle>
          {selected && (
            <div className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  src={selected.image}
                  alt={`Detection of ${selected.person}`}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Person</span>
                  <span className="font-medium">{selected.person}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Camera</span>
                  <span className="font-medium">{selected.camera}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence</span>
                  <ConfidenceBadge value={selected.confidence} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timestamp</span>
                  <span className="font-medium">
                    {format(
                      new Date(selected.timestamp),
                      "MMM d, yyyy · HH:mm:ss"
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
