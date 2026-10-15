"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Info, ShieldCheck, KeyRound } from "lucide-react"
import { changePasswordAction } from "@/app/actions/change-password"

export function ChangePasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [showCurrent, setShowCurrent] = React.useState(false)
  const [showNew, setShowNew] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await changePasswordAction(formData)

    if (!result.success) {
      setError(result.error || "Failed to update password.")
      setIsSubmitting(false)
      return
    }

    // ✅ Success — go to the next onboarding step
    router.push("/complete-profile")
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
        <div className="flex flex-col items-start gap-2 text-left mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <ShieldCheck className="size-3.5" />
            Step 1 of 2
          </div>
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-500 leading-tight mt-2">
            Change Your Password
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            For security, you must change the password we sent you before continuing.
          </p>
        </div>

        {/* Current Password */}
        <Field>
          <FieldLabel htmlFor="currentPassword" className="flex items-center gap-2">
            <KeyRound className="size-4 text-gray-500" />
            Current Password
          </FieldLabel>
          <div className="relative">
            <Input
              id="currentPassword"
              name="currentPassword"
              type={showCurrent ? "text" : "password"}
              placeholder="The password we emailed you"
              className="h-12 border-gray-300 focus-visible:ring-blue-600 pr-12"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-600 transition-colors"
            >
              {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </Field>

        {/* New Password */}
        <Field>
          <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
          <div className="relative">
            <Input
              id="newPassword"
              name="newPassword"
              type={showNew ? "text" : "password"}
              placeholder="At least 8 characters"
              className="h-12 border-gray-300 focus-visible:ring-blue-600 pr-12"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNew((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-600 transition-colors"
            >
              {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <FieldDescription>
            Use a strong password with letters, numbers, and symbols.
          </FieldDescription>
        </Field>

        {/* Confirm Password */}
        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter your new password"
              className="h-12 border-gray-300 focus-visible:ring-blue-600 pr-12"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-600 transition-colors"
            >
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </Field>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900">
            <Info className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 dark:text-red-200 font-medium">{error}</p>
          </div>
        )}

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
          <Info className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
            After changing your password, you'll set up your organization profile.
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-4 mt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Updating password...
              </>
            ) : (
              "Continue to Profile Setup"
            )}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}