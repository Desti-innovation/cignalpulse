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
import { Loader2, Info, CheckCircle2 } from "lucide-react"
import { updatePhoneAction } from "@/app/actions/update-phone"

interface Props {
  initialPhone: string
}

export function PhoneForm({ initialPhone }: Props) {
  const router = useRouter()
  const [phone, setPhone] = React.useState(initialPhone)
  const [isSaving, setIsSaving] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const hasChanges = phone !== initialPhone

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.append("phone", phone)

    const result = await updatePhoneAction(formData)

    if (!result.success) {
      setError(result.error || "Failed to save.")
      setIsSaving(false)
      return
    }

    setSuccess(true)
    setIsSaving(false)
    router.refresh()
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <form onSubmit={handleSave}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+233 59 342 5854"
            className="h-11 border-gray-300 focus-visible:ring-blue-600"
          />
          <FieldDescription>
            We&apos;ll use this number to send password reset codes via SMS.
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

        {success && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900">
            <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <p className="text-xs text-green-800 dark:text-green-200 font-medium">
              Phone number updated.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!hasChanges || isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Save phone"
            )}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}