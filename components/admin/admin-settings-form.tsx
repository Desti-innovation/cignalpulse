"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import {
  updateAdminProfileAction,
  changeAdminPasswordAction,
  updatePlatformSettingsAction,
} from "@/app/actions/admin-settings"
import type { AdminProfile, PlatformSettings } from "@/app/actions/admin-settings"
import {
  User,
  KeyRound,
  Settings,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react"

interface Props {
  profile: AdminProfile
  platform: PlatformSettings
}

type Msg = { type: "ok" | "err"; text: string } | null

export function AdminSettingsForm({ profile, platform }: Props) {
  const router = useRouter()
  const [profileMsg, setProfileMsg] = React.useState<Msg>(null)
  const [passwordMsg, setPasswordMsg] = React.useState<Msg>(null)
  const [platformMsg, setPlatformMsg] = React.useState<Msg>(null)

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your admin profile and platform configuration.
        </p>
      </div>

      <ProfileSection
        profile={profile}
        msg={profileMsg}
        onMsg={setProfileMsg}
        onSaved={() => router.refresh()}
      />
      <PasswordSection msg={passwordMsg} onMsg={setPasswordMsg} />
      <PlatformSection
        platform={platform}
        msg={platformMsg}
        onMsg={setPlatformMsg}
        onSaved={() => router.refresh()}
      />
    </div>
  )
}

// ============================================================
// Reusable feedback banner
// ============================================================

function FeedbackBanner({ msg }: { msg: Msg }) {
  if (!msg) return null
  const isOk = msg.type === "ok"
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${
        isOk
          ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900 text-green-800 dark:text-green-200"
          : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200"
      }`}
    >
      {isOk ? (
        <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="size-5 shrink-0 mt-0.5" />
      )}
      <p className="text-sm font-medium">{msg.text}</p>
    </div>
  )
}

// ============================================================
// Profile section
// ============================================================

function ProfileSection({
  profile,
  msg,
  onMsg,
  onSaved,
}: {
  profile: AdminProfile
  msg: Msg
  onMsg: (m: Msg) => void
  onSaved: () => void
}) {
  const [isSaving, setIsSaving] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    onMsg(null)

    const result = await updateAdminProfileAction(new FormData(e.currentTarget))

    if (!result.success) {
      onMsg({ type: "err", text: result.error || "Update failed." })
    } else {
      onMsg({ type: "ok", text: result.message || "Saved." })
      onSaved()
    }
    setIsSaving(false)
    setTimeout(() => onMsg(null), 4000)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <User className="size-5 text-blue-600" />
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          Admin Profile
        </h2>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            defaultValue={profile.full_name}
            placeholder="Your full name"
            className="h-11 border-gray-300 focus-visible:ring-blue-600"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email Address</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={profile.email}
            placeholder="you@example.com"
            className="h-11 border-gray-300 focus-visible:ring-blue-600"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            value={profile.username}
            disabled
            className="h-11 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-muted-foreground cursor-not-allowed font-mono"
          />
          <FieldDescription>
            Username cannot be changed for security reasons.
          </FieldDescription>
        </Field>

        <FeedbackBanner msg={msg} />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
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
      </FieldGroup>
    </form>
  )
}

// ============================================================
// Password section
// ============================================================

function PasswordSection({ msg, onMsg }: { msg: Msg; onMsg: (m: Msg) => void }) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [showCurrent, setShowCurrent] = React.useState(false)
  const [showNew, setShowNew] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    onMsg(null)

    const form = e.currentTarget
    const result = await changeAdminPasswordAction(new FormData(form))

    if (!result.success) {
      onMsg({ type: "err", text: result.error || "Update failed." })
    } else {
      onMsg({ type: "ok", text: result.message || "Password updated." })
      form.reset()
      setShowCurrent(false)
      setShowNew(false)
      setShowConfirm(false)
    }
    setIsSaving(false)
    setTimeout(() => onMsg(null), 4000)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <KeyRound className="size-5 text-amber-600" />
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          Change Password
        </h2>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
          <div className="relative">
            <Input
              id="currentPassword"
              name="currentPassword"
              type={showCurrent ? "text" : "password"}
              placeholder="Enter your current password"
              className="h-11 border-gray-300 focus-visible:ring-blue-600 pr-12"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-600 transition-colors"
              aria-label={showCurrent ? "Hide password" : "Show password"}
            >
              {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
          <div className="relative">
            <Input
              id="newPassword"
              name="newPassword"
              type={showNew ? "text" : "password"}
              placeholder="At least 8 characters"
              className="h-11 border-gray-300 focus-visible:ring-blue-600 pr-12"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNew((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-600 transition-colors"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <FieldDescription>
            Use a strong password with letters, numbers, and symbols.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter the new password"
              className="h-11 border-gray-300 focus-visible:ring-blue-600 pr-12"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-600 transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        <FeedbackBanner msg={msg} />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-amber-600 hover:bg-amber-700 text-white min-w-[140px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}

// ============================================================
// Platform section
// ============================================================

function PlatformSection({
  platform,
  msg,
  onMsg,
  onSaved,
}: {
  platform: PlatformSettings
  msg: Msg
  onMsg: (m: Msg) => void
  onSaved: () => void
}) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [maintenanceMode, setMaintenanceMode] = React.useState(platform.maintenanceMode)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    onMsg(null)

    const formData = new FormData(e.currentTarget)
    // Switch doesn't submit a value, so we append it manually
    formData.set("maintenanceMode", maintenanceMode ? "on" : "off")

    const result = await updatePlatformSettingsAction(formData)

    if (!result.success) {
      onMsg({ type: "err", text: result.error || "Save failed." })
    } else {
      onMsg({ type: "ok", text: result.message || "Saved." })
      onSaved()
    }
    setIsSaving(false)
    setTimeout(() => onMsg(null), 4000)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <Settings className="size-5 text-purple-600" />
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          Platform Settings
        </h2>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="platformName">Platform Name</FieldLabel>
          <Input
            id="platformName"
            name="platformName"
            type="text"
            defaultValue={platform.platformName}
            placeholder="CignalPulse"
            className="h-11 border-gray-300 focus-visible:ring-blue-600"
            required
          />
          <FieldDescription>
            Shown in the sidebar and email templates.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="supportEmail">Support Email</FieldLabel>
          <Input
            id="supportEmail"
            name="supportEmail"
            type="email"
            defaultValue={platform.supportEmail}
            placeholder="support@Cignalpulse.com"
            className="h-11 border-gray-300 focus-visible:ring-blue-600"
          />
          <FieldDescription>
            Customers will be directed here for help.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="defaultCountryCode">Default Country Code</FieldLabel>
          <Input
            id="defaultCountryCode"
            name="defaultCountryCode"
            type="text"
            defaultValue={platform.defaultCountryCode}
            placeholder="+233"
            className="h-11 border-gray-300 focus-visible:ring-blue-600 font-mono"
            maxLength={5}
          />
          <FieldDescription>
            Used when phone numbers are entered without a country code.
          </FieldDescription>
        </Field>

        <Field>
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div>
              <FieldLabel htmlFor="maintenanceMode" className="mb-0">
                Maintenance Mode
              </FieldLabel>
              <FieldDescription className="mt-1">
                When enabled, regular users cannot log in. Admins are unaffected.
              </FieldDescription>
            </div>
            <Switch
              id="maintenanceMode"
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>
        </Field>

        <FeedbackBanner msg={msg} />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-700 text-white min-w-[140px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}