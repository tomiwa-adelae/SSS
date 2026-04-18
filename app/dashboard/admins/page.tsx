"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { IconUserPlus } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/PageHeader"
import { useAuth } from "@/store/useAuth"

type AdminUser = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
}

const createAdminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  role: z.enum(["admin", "security", "analyst"]),
})

type CreateAdminValues = z.infer<typeof createAdminSchema>

const roles = [
  { value: "admin", label: "Admin" },
  { value: "security", label: "Security" },
  { value: "analyst", label: "Analyst" },
]

const roleVariant: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  security: "secondary",
  analyst: "outline",
}

export default function AdminsPage() {
  const { token } = useAuth()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(true)

  const form = useForm<CreateAdminValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { username: "", email: "", password: "" },
  })

  useEffect(() => {
    fetchAdmins()
  }, [])

  async function fetchAdmins() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/users/`,
        { headers: { Authorization: `Token ${token}` } }
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAdmins(data)
    } catch {
      toast.error("Failed to load admin users.")
    } finally {
      setLoadingAdmins(false)
    }
  }

  async function onSubmit(values: CreateAdminValues) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/create-admin/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify(values),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        toast.error(
          data?.detail || data?.message || "Failed to create account."
        )
        return
      }

      toast.success(`Account created for @${data.username}.`)
      setAdmins((prev) => [
        {
          id: Date.now(),
          username: data.username,
          email: values.email,
          first_name: "",
          last_name: "",
          role: data.role,
          is_active: true,
        },
        ...prev,
      ])
      form.reset()
    } catch {
      toast.error("Network error. Please try again.")
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Management"
        description="Create and view admin accounts for the surveillance system"
      />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconUserPlus className="size-4" />
            New Admin Account
          </CardTitle>
          <CardDescription>
            The new user will receive credentials to access the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. johndoe"
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="e.g. john@example.com"
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Min. 8 chars, uppercase, number, symbol"
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={form.formState.isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full"
              >
                {form.formState.isSubmitting ? "Creating…" : "Create Account"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-base font-medium">All Admin Users</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingAdmins ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-44" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No admin users found.
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      @{admin.username}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {admin.email || "—"}
                    </TableCell>
                    <TableCell>
                      {admin.role ? (
                        <Badge variant={roleVariant[admin.role] ?? "outline"}>
                          {admin.role.charAt(0).toUpperCase() +
                            admin.role.slice(1)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={admin.is_active ? "default" : "secondary"}
                        className={
                          admin.is_active
                            ? "bg-green-500/15 text-green-600 dark:text-green-400"
                            : ""
                        }
                      >
                        {admin.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
