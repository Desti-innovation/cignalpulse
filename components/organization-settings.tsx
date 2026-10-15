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
import { LogoUploader } from "@/components/logo-uploader"
import { PhoneForm } from "@/components/phone-form"
import { updateOrganizationAction } from "@/app/actions/update-organization"
import {
  Building2,
  Mail,
  Hash,
  ShieldCheck,
  CheckCircle2,
  Info,
  Loader2,
  Calendar,
  Phone,
} from "lucide-react"

interface OrganizationSettingsProps {
  user: {
    username: string
    email: string
    companyName: string
    displayName: string
    logoUrl: string | null
    phone: string | null      // ← ADDED
    senderId: string | null
    requestStatus: string | null
    createdAt: string
  }
}

export function OrganizationSettings({ user }: OrganizationSettingsProps) {
  const router = useRouter()
  const [displayName, setDisplayName] = React.useState(user.displayName)
  const [logoUrl, setLogoUrl] = React.useState(user.logoUrl)
  const [isSaving, setIsSaving] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const initials = user.companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const hasChanges =
    displayName !== user.displayName || logoUrl !== user.logoUrl

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.append("displayName", displayName)

    const result = await updateOrganizationAction(formData)

    if (!result.success) {
      setError(result.error || "Failed to save changes.")
      setIsSaving(false)
      return
    }

    setSuccess(true)
    setIsSaving(false)
    router.refresh()

    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Organization Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your company profile, logo, and account information.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo Section */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="size-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Company Logo
            </h2>
          </div>

          <div className="flex flex-col items-center py-4">
            <LogoUploader
              currentLogo={logoUrl}
              initials={initials}
              onUploaded={(url) => {
                setLogoUrl(url || null)
                router.refresh()
              }}
            />
          </div>
        </div>

        {/* Organization Details */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="size-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Organization Details
            </h2>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="displayName">Display Name</FieldLabel>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={user.companyName}
                maxLength={60}
                className="h-11 border-gray-300 focus-visible:ring-blue-600"
                required
              />
              <FieldDescription>
                Shown in the dashboard sidebar, header, and emails.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="companyName">
                Registered Company Name
              </FieldLabel>
              <Input
                id="companyName"
                value={user.companyName}
                disabled
                className="h-11 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-muted-foreground cursor-not-allowed"
              />
              <FieldDescription>
                This was set during Sender ID registration and cannot be changed
                here. Contact support if you need to update it.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </div>

        {/* Contact & Security — NEW */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="size-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Contact &amp; Security
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-6">
            Used to send you password reset codes and important account alerts.
          </p>

          <PhoneForm initialPhone={user.phone ?? ""} />
        </div>

        {/* Account Info (read-only) */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="size-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Account Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <Hash className="size-4 text-gray-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Username</p>
                <p className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user.username}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <Mail className="size-4 text-gray-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <ShieldCheck className="size-4 text-green-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Sender ID</p>
                <p className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user.senderId || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <Calendar className="size-4 text-gray-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-1">
                  Member Since
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.createdAt}
                </p>
              </div>
            </div>
          </div>

          {user.requestStatus && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Sender ID Status:
              </span>
              <span
                className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                  ${
                    user.requestStatus === "approved"
                      ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300"
                      : user.requestStatus === "rejected"
                      ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300"
                      : "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300"
                  }
                `}
              >
                <CheckCircle2 className="size-3" />
                {user.requestStatus.charAt(0).toUpperCase() +
                  user.requestStatus.slice(1)}
              </span>
            </div>
          )}
        </div>

        {/* Feedback Banner */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900">
            <Info className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 dark:text-red-200 font-medium">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900">
            <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <p className="text-xs text-green-800 dark:text-green-200 font-medium">
              Changes saved successfully.
            </p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDisplayName(user.displayName)
              setLogoUrl(user.logoUrl)
              setError(null)
              setSuccess(false)
            }}
            disabled={!hasChanges || isSaving}
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={!hasChanges || isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}