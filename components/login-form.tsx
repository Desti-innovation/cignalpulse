"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Info, CheckCircle2 } from "lucide-react"
import { loginAction } from "@/app/actions/auth"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resetSuccess = searchParams.get("reset") === "success"

  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await loginAction(formData)

    if (!result.success) {
      setError(result.error || "Login failed.")
      setIsSubmitting(false)
      return
    }

    router.push(result.redirectTo || "/dashboard")
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-start gap-2 text-left mb-4">
          <h1 className="text-3xl font-bold text-blue-400 leading-tight">
            Welcome back to <br /> CignalPulse
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Log in to manage your SMS campaigns and messages.
          </p>
        </div>

        {resetSuccess && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-green-950/40 border border-green-900">
            <CheckCircle2 className="size-5 text-green-400 shrink-0 mt-0.5" />
            <p className="text-xs text-green-200 font-medium">
              Password reset successful. You can now log in with your new
              password.
            </p>
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="username" className="text-gray-300">
            Username
          </FieldLabel>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="your-username"
            className="h-12 bg-gray-900 border-gray-800 text-gray-100 placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:border-blue-500"
            required
            autoComplete="username"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password" className="text-gray-300">
            Password
          </FieldLabel>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="h-12 bg-gray-900 border-gray-800 text-gray-100 placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:border-blue-500 pr-12"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-400 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </Field>

        <div className="flex justify-end -mt-3">
          <Link
            href="/forgot-password"
            className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-medium"
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-950/40 border border-red-900">
            <Info className="size-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200 font-medium">{error}</p>
          </div>
        )}

        <div className="flex gap-4 mt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11 text-base font-medium disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}