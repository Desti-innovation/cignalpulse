"use client"

import * as React from "react"
import Link from "next/link"
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
import { Eye, EyeOff, Info, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { signupAction } from "@/app/actions/signup"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  // Live password checks
  const passwordChecks = {
    length: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
  }
  const passwordValid =
    passwordChecks.length && passwordChecks.hasLetter && passwordChecks.hasNumber
  const passwordsMatch =
    password.length > 0 && password === confirmPassword

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!passwordValid) {
      setError("Please use a stronger password.")
      setIsSubmitting(false)
      return
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.")
      setIsSubmitting(false)
      return
    }

    const formData = new FormData(e.currentTarget)
    const result = await signupAction(formData)

    if (!result.success) {
      setError(result.error || "Signup failed.")
      setIsSubmitting(false)
      return
    }

    // The action already set the session cookie — now go to sender ID request
    router.push("/sender-id-request")
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
            Create your <br /> CignalPulse account
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Get started in 2 minutes. No credit card required.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="companyName" className="text-gray-300">
            Company name
          </FieldLabel>
          <Input
            id="companyName"
            name="companyName"
            type="text"
            placeholder="Destora Technology"
            className="h-12 bg-gray-900 border-gray-800 text-gray-100 placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:border-blue-500"
            required
            maxLength={100}
            autoComplete="organization"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="username" className="text-gray-300">
            Username
          </FieldLabel>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="destora-technology"
            className="h-12 bg-gray-900 border-gray-800 text-gray-100 placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:border-blue-500"
            required
            maxLength={50}
            autoComplete="username"
          />
          <FieldDescription className="text-gray-500">
            Letters, numbers, and dashes. This is what you&apos;ll log in with.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="email" className="text-gray-300">
            Email
          </FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            className="h-12 bg-gray-900 border-gray-800 text-gray-100 placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:border-blue-500"
            required
            maxLength={200}
            autoComplete="email"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="phone" className="text-gray-300">
            Phone number
          </FieldLabel>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+233 59 342 5854"
            className="h-12 bg-gray-900 border-gray-800 text-gray-100 placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:border-blue-500"
            required
            maxLength={20}
            autoComplete="tel"
          />
          <FieldDescription className="text-gray-500">
            Used for password resets and important account alerts via SMS.
          </FieldDescription>
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
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-gray-900 border-gray-800 text-gray-100 placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:border-blue-500 pr-12"
              required
              autoComplete="new-password"
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

          {password.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <PasswordCheck
                ok={passwordChecks.length}
                label="At least 8 characters"
              />
              <PasswordCheck
                ok={passwordChecks.hasLetter}
                label="Contains a letter"
              />
              <PasswordCheck
                ok={passwordChecks.hasNumber}
                label="Contains a number"
              />
            </div>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword" className="text-gray-300">
            Confirm password
          </FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12 bg-gray-900 border-gray-800 text-gray-100 placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:border-blue-500"
            required
            autoComplete="new-password"
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <FieldDescription className="text-amber-400">
              Passwords don&apos;t match yet.
            </FieldDescription>
          )}
        </Field>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-950/40 border border-red-900">
            <Info className="size-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200 font-medium">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11 text-base font-medium disabled:opacity-70 mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center leading-relaxed">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="text-blue-400 hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-blue-400 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </FieldGroup>
    </form>
  )
}

function PasswordCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ok ? (
        <CheckCircle2 className="size-3.5 text-green-400 shrink-0" />
      ) : (
        <XCircle className="size-3.5 text-gray-600 shrink-0" />
      )}
      <span className={ok ? "text-green-400" : "text-gray-500"}>{label}</span>
    </div>
  )
}