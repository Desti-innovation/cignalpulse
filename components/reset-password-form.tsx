"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { Info, Loader2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { resetPasswordAction } from "@/app/actions/password-reset"

interface Props {
  identifier: string
  resetToken: string
}

export function ResetPasswordForm({ identifier, resetToken }: Props) {
  const router = useRouter()
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.append("identifier", identifier)
    formData.append("resetToken", resetToken)
    formData.append("newPassword", newPassword)
    formData.append("confirmPassword", confirmPassword)

    const result = await resetPasswordAction(formData)

    if (!result.success) {
      setError(result.error || "Something went wrong.")
      setIsSubmitting(false)
      return
    }

    setSuccess(true)
    setIsSubmitting(false)

    // Redirect to login after showing success
    setTimeout(() => {
      router.push("/login?reset=success")
    }, 1800)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center text-center py-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/50 mb-4">
          <CheckCircle2 className="size-7 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Password updated
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Your password has been changed. Redirecting to login…
        </p>
        <Loader2 className="size-5 text-gray-400 animate-spin" />
      </div>
    )
  }

  const passwordsMatch =
    newPassword && confirmPassword && newPassword === confirmPassword
  const longEnough = newPassword.length >= 8

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-start gap-2 text-left mb-2">
          <div className="flex size-11 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 mb-2">
            <Lock className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Set a new password
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose a strong password for your account.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="newPassword">New password</FieldLabel>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="h-11 border-gray-300 focus-visible:ring-blue-600 pr-12"
              autoComplete="new-password"
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
          {newPassword && !longEnough && (
            <FieldDescription className="text-amber-600 dark:text-amber-500">
              Must be at least 8 characters.
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            className="h-11 border-gray-300 focus-visible:ring-blue-600"
            autoComplete="new-password"
            required
          />
          {confirmPassword && !passwordsMatch && (
            <FieldDescription className="text-amber-600 dark:text-amber-500">
              Passwords don&apos;t match.
            </FieldDescription>
          )}
        </Field>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900">
            <Info className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 dark:text-red-200 font-medium">
              {error}
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || !passwordsMatch || !longEnough}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-base font-medium disabled:opacity-70 mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Updating…
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </FieldGroup>
    </form>
  )
}