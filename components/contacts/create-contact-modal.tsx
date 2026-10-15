"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { createContactAction } from "@/app/actions/contacts"
import type { ContactGroup } from "@/app/actions/contact-groups"
import { AlertCircle, Loader2 } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: ContactGroup[]
  onCreated: (message: string) => void
}

export function CreateContactModal({
  open,
  onOpenChange,
  groups,
  onCreated,
}: Props) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [groupId, setGroupId] = React.useState<string>("none")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set("groupId", groupId)

    const result = await createContactAction(formData)

    if (!result.success) {
      setError(result.error || "Failed to create contact.")
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    onOpenChange(false)
    onCreated("Contact added.")
  }

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      setError(null)
      setGroupId("none")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
          <DialogDescription>
            Add a single contact to your list. For many at once, use CSV
            import.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="024 123 4567 or +233 24 123 4567"
                className="h-11"
                required
                autoFocus
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="John"
                  className="h-11"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  className="h-11"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Add to Group (optional)</FieldLabel>
              <Select value={groupId} onValueChange={(v) => setGroupId(v ?? "none")}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="No group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No group</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {error && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 dark:text-red-200 font-medium">
                  {error}
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
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
                    Adding...
                  </>
                ) : (
                  "Add Contact"
                )}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}