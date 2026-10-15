"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Info, Loader2, ShieldCheck, RotateCw } from "lucide-react"
import { verifyOtpAction } from "@/app/actions/password-reset"

interface Props {
  identifier: string
}

export function VerifyOtpForm({ identifier }: Props) {
  const router = useRouter()
  const [otp, setOtp] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [countdown, setCountdown] = React.useState(60)
  const [canResend, setCanResend] = React.useState(false)

  // Countdown timer for resend
  React.useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.append("identifier", identifier)
    formData.append("otp", otp)

    const result = await verifyOtpAction(formData)

    if (!result.success || !result.resetToken) {
      setError(result.error || "Verification failed.")
      setIsSubmitting(false)
      setOtp("")
      return
    }

    router.push(
      `/forgot-password/reset?identifier=${encodeURIComponent(
        identifier
      )}&token=${encodeURIComponent(result.resetToken)}`
    )
  }

  const handleResend = async () => {
    setCanResend(false)
    setCountdown(60)
    setError(null)
    // Reset the flow — request a fresh OTP
    const { requestResetAction } = await import("@/app/actions/password-reset")
    const formData = new FormData()
    formData.append("identifier", identifier)
    await requestResetAction(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-start gap-2 text-left mb-2">
          <div className="flex size-11 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 mb-2">
            <ShieldCheck className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Enter verification code
          </h1>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to the email and phone on file for{" "}
            <strong>{identifier}</strong>.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="otp" className="sr-only">
            Verification code
          </FieldLabel>
          <Input
            id="otp"
            value={otp}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 6)
              setOtp(v)
            }}
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="h-14 text-center text-2xl font-mono tracking-[0.5em] border-gray-300 focus-visible:ring-blue-600"
            autoFocus
            maxLength={6}
            required
          />
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
          disabled={isSubmitting || otp.length !== 6}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-base font-medium disabled:opacity-70 mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Verifying…
            </>
          ) : (
            "Verify code"
          )}
        </Button>

        <div className="flex items-center justify-center pt-2">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium"
            >
              <RotateCw className="size-3.5" />
              Resend code
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Resend in {countdown}s
            </p>
          )}
        </div>
      </FieldGroup>
    </form>
  )
}