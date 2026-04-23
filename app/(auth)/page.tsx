"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  IconCamera,
  IconEye,
  IconEyeOff,
  IconLock,
  IconUser,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useAuth } from "@/store/useAuth"
import { env } from "@/lib/env"

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setToken } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  })

  async function onSubmit(values: LoginValues) {
    try {
      const res = await fetch(
        `${env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/login/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.detail || data?.message || "Invalid credentials.")
        return
      }

      setToken(data.token)
      setUser({
        id: "",
        email: "",
        firstName: "",
        lastName: "",
        otherName: "",
        username: data.username,
        phoneNumber: "",
        image: null,
        dob: null,
        createdAt: null,
        city: null,
        address: null,
        state: null,
        country: null,
        gender: null,
        role: data.role || "ADMIN",
      })

      toast.success("Login successful. Welcome back!")
      router.push("/dashboard")
    } catch {
      toast.error("Network error. Please try again.")
    }
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-slate-100 to-blue-50 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle color="black" />
      </div>

      <div className="relative mx-4 w-full max-w-sm">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700/50 dark:bg-slate-900/90 dark:shadow-2xl">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 ring-2 ring-blue-200 dark:bg-blue-500/20 dark:ring-blue-500/30">
              <IconCamera className="size-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Smart Surveillance System
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Secure Monitoring Dashboard
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <IconUser className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="Username"
                          disabled={isSubmitting}
                          className="h-11 pl-10 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500"
                          {...field}
                        />
                      </div>
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
                    <FormControl>
                      <div className="relative">
                        <IconLock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          disabled={isSubmitting}
                          className="h-11 pr-10 pl-10 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showPassword ? (
                            <IconEyeOff className="size-4" />
                          ) : (
                            <IconEye className="size-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full bg-blue-600 font-medium text-white hover:bg-blue-700 disabled:opacity-70"
              >
                {isSubmitting ? "Signing in…" : "Log In"}
              </Button>
              <Link
                href="/forgot-password"
                className="w-full text-center text-sm text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Forgot Password?
              </Link>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
