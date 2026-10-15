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
import { LogoUploader } from "@/components/logo-uploader"
import { Info, Sparkles } from "lucide-react"
import { completeProfileAction } from "@/app/actions/update-profile"

interface CompleteProfileFormProps {
  username: string
  email: string
  companyName: string
  currentLogo: string | null
  className?: string
}

export function CompleteProfileForm({
  username,
  email,
  companyName,
  currentLogo,
  className,
}: CompleteProfileFormProps) {
  const router = useRouter()
  const [displayName, setDisplayName] = React.useState(companyName)
  const [logoUrl, setLogoUrl] = React.useState<string | null>(currentLogo)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const initials = companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.append("displayName", displayName)

    const result = await completeProfileAction(formData)

    if (!result.success) {
      setError(result.error || "Something went wrong.")
      setIsSubmitting(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        {/* Header */}
        <div className="flex flex-col items-start gap-2 text-left mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Sparkles className="size-3.5" />
            Final Step
          </div>
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-500 leading-tight mt-2">
            Complete Your Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personalize your account so your team recognizes your brand instantly.
          </p>
        </div>

        {/* Logo Uploader */}
        <div className="flex flex-col items-center py-4">
          <LogoUploader
            currentLogo={currentLogo}
            initials={initials}
            onUploaded={setLogoUrl}
          />
        </div>

        {/* Display Name */}
        <Field>
          <FieldLabel htmlFor="displayName">
            Display Name
          </FieldLabel>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={companyName}
            maxLength={60}
            className="h-12 border-gray-300 focus-visible:ring-blue-600"
            required
          />
          <FieldDescription>
            This is how your organization appears in the dashboard.
          </FieldDescription>
        </Field>

        {/* Read-only Account Info */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Username</p>
            <p className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
              {username}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {email}
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
          <Info className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
            You can always change these later in Settings. Let's get you to the dashboard!
          </p>
        </div>

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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Continue to Dashboard"
            )}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}