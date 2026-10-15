"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Info, ShieldAlert } from "lucide-react"
import { adminLoginAction } from "@/app/actions/admin-auth"

export function AdminLoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await adminLoginAction(formData)

    if (!result.success) {
      setError(result.error || "Login failed.")
      setIsSubmitting(false)
      return
    }

    router.push(result.redirectTo || "/admin")
    router.refresh()
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        {/* Header */}
        <div className="flex flex-col items-start gap-2 text-left mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <ShieldAlert className="size-3.5" />
            Restricted Access
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight mt-2">
            CignalPulse <br />
            <span className="text-blue-600 dark:text-blue-500">Admin Portal</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Authorized personnel only. All login attempts are logged.
          </p>
        </div>

        {/* Username */}
        <Field>
          <FieldLabel htmlFor="username" className="sr-only">Admin Username</FieldLabel>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="Admin Username"
            className="h-12 border-gray-300 focus-visible:ring-blue-600"
            required
            autoComplete="username"
          />
        </Field>

        {/* Password */}
        <Field>
          <FieldLabel htmlFor="password" className="sr-only">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="h-12 border-gray-300 focus-visible:ring-blue-600 pr-12"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </Field>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900">
            <Info className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 dark:text-red-200 font-medium">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4 mt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 text-base font-medium disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Authenticating...
              </>
            ) : (
              "Sign In to Admin Portal"
            )}
          </Button>
        </div>

        {/* Info footer */}
        <p className="text-[11px] text-center text-muted-foreground pt-2">
          Session expires in 24 hours. IP addresses are recorded.
        </p>
      </FieldGroup>
    </form>
  )
}