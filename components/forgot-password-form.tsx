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
import { Info, Loader2, KeyRound, Mail, MessageSquare } from "lucide-react"
import { requestResetAction } from "@/app/actions/password-reset"

export function ForgotPasswordForm() {
  const router = useRouter()
  const [identifier, setIdentifier] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)
  const [channels, setChannels] = React.useState<{
    email: boolean
    sms: boolean
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.append("identifier", identifier)

    const result = await requestResetAction(formData)

    if (!result.success) {
      setError(result.error || "Something went wrong.")
      setIsSubmitting(false)
      return
    }

    setChannels(result.channels ?? null)
    setSent(true)
    setIsSubmitting(false)

    // Move to OTP verify step
    setTimeout(() => {
      router.push(
        `/forgot-password/verify?identifier=${encodeURIComponent(identifier)}`
      )
    }, 1200)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/50 mb-4">
          <KeyRound className="size-7 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Check your inbox
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          If an account exists for <strong>{identifier}</strong>, we&apos;ve sent
          a verification code.
        </p>
        {channels && (
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-4">
            {channels.email && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                <Mail className="size-3" /> Email
              </span>
            )}
            {channels.sms && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                <MessageSquare className="size-3" /> SMS
              </span>
            )}
          </div>
        )}
        <Loader2 className="size-5 text-gray-400 animate-spin" />
        <p className="text-xs text-muted-foreground mt-2">Redirecting…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-start gap-2 text-left mb-2">
          <div className="flex size-11 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 mb-2">
            <KeyRound className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Forgot your password?
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your username or email and we&apos;ll send you a verification
            code to reset your password.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="identifier">Username or Email</FieldLabel>
          <Input
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="e.g. destora-technology or you@company.com"
            className="h-11 border-gray-300 focus-visible:ring-blue-600"
            autoComplete="username"
            autoFocus
            required
          />
          <FieldDescription>
            We&apos;ll send a 6-digit code to your registered email and phone.
          </FieldDescription>
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
          disabled={isSubmitting || !identifier.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-base font-medium disabled:opacity-70 mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Sending code…
            </>
          ) : (
            "Send verification code"
          )}
        </Button>
      </FieldGroup>
    </form>
  )
}