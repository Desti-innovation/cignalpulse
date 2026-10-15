"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import {
  updateContactAction,
  deleteContactAction,
  toggleContactOptOutAction,
  type Contact,
} from "@/app/actions/contacts"
import type { ContactGroup } from "@/app/actions/contact-groups"
import {
  AlertCircle,
  Loader2,
  Trash2,
  UserX,
  UserCheck,
} from "lucide-react"

interface Props {
  contact: Contact | null
  groups: ContactGroup[]
  onOpenChange: (open: boolean) => void
  onSaved: (message: string) => void
}

export function ContactEditorSheet({
  contact,
  groups,
  onOpenChange,
  onSaved,
}: Props) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isToggling, setIsToggling] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isActive, setIsActive] = React.useState(true)

  // Sync local opt-out state when contact changes
  React.useEffect(() => {
    if (contact) {
      setIsActive(contact.isActive)
      setError(null)
    }
  }, [contact])

  if (!contact) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await updateContactAction(contact.id, formData)

    if (!result.success) {
      setError(result.error || "Failed to update contact.")
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    onSaved("Contact updated.")
  }

  const handleDelete = async () => {
    if (!confirm(`Delete contact +${contact.phone}? This cannot be undone.`)) return
    setIsDeleting(true)
    const result = await deleteContactAction(contact.id)
    setIsDeleting(false)

    if (!result.success) {
      setError(result.error || "Delete failed.")
      return
    }

    onOpenChange(false)
    onSaved("Contact deleted.")
  }

  const handleToggleOptOut = async (value: boolean) => {
    // value = isActive (true means they can receive SMS)
    // optOut = !value
    setIsToggling(true)
    setIsActive(value)
    const result = await toggleContactOptOutAction(contact.id, !value)
    setIsToggling(false)

    if (!result.success) {
      setIsActive(!value)
      setError(result.error || "Update failed.")
      return
    }

    onSaved(value ? "Contact re-activated." : "Contact opted out.")
  }

  // Show groups the contact currently belongs to (for context)
  const memberGroups = groups.filter((g) => contact.groupIds.includes(g.id))

  return (
    <Dialog open={!!contact} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription className="font-mono">
            +{contact.phone}
          </DialogDescription>
        </DialogHeader>

        {/* Opt-out toggle — very prominent */}
        <div
          className={`
            flex items-center justify-between p-4 rounded-xl border-2
            ${
              isActive
                ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
            }
          `}
        >
          <div className="flex items-center gap-3">
            {isActive ? (
              <UserCheck className="size-5 text-green-600 dark:text-green-400" />
            ) : (
              <UserX className="size-5 text-amber-600 dark:text-amber-400" />
            )}
            <div>
              <p
                className={`text-sm font-semibold ${
                  isActive
                    ? "text-green-900 dark:text-green-100"
                    : "text-amber-900 dark:text-amber-100"
                }`}
              >
                {isActive ? "Can receive SMS" : "Opted out"}
              </p>
              <p
                className={`text-[11px] ${
                  isActive
                    ? "text-green-700 dark:text-green-300"
                    : "text-amber-700 dark:text-amber-300"
                }`}
              >
                {isActive
                  ? "This contact will receive your campaigns"
                  : "This contact will be skipped in all campaigns"}
              </p>
            </div>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={handleToggleOptOut}
            disabled={isToggling}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                defaultValue={contact.phone}
                className="h-11 font-mono"
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  defaultValue={contact.firstName ?? ""}
                  className="h-11"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  defaultValue={contact.lastName ?? ""}
                  className="h-11"
                />
              </Field>
            </div>

            {memberGroups.length > 0 && (
              <Field>
                <FieldLabel>Groups</FieldLabel>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800">
                  {memberGroups.map((g) => (
                    <span
                      key={g.id}
                      className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
                <FieldDescription>
                  Manage group membership from the group page.
                </FieldDescription>
              </Field>
            )}

            {error && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 dark:text-red-200 font-medium">
                  {error}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 gap-2 h-10"
              >
                {isDeleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Delete
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}