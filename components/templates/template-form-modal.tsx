"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  createUserTemplateAction,
  updateUserTemplateAction,
  type UserTemplate,
} from "@/app/actions/user-templates"
import { calculateSmsParts } from "@/lib/sms-parts"
import { AlertCircle, Loader2, FileText } from "lucide-react"

// ============================================================
// Props
// ============================================================

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: UserTemplate | null
  onSaved: (message: string) => void
}

// ============================================================
// Component
// ============================================================

export function TemplateFormModal({
  open,
  onOpenChange,
  template,
  onSaved,
}: Props) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [body, setBody] = React.useState(template?.body ?? "")

  // Sync body when template changes (for edit mode)
  React.useEffect(() => {
    setBody(template?.body ?? "")
    setError(null)
  }, [template, open])

  const parts = calculateSmsParts(body)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const result = template
      ? await updateUserTemplateAction(template.id, formData)
      : await createUserTemplateAction(formData)

    if (!result.success) {
      setError(result.error || "Save failed.")
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    onOpenChange(false)
    onSaved(template ? "Template updated." : "Template created.")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Template" : "New Template"}
          </DialogTitle>
          <DialogDescription>
            {template
              ? "Update the name or content of this template."
              : "Save a message you send often so you can reuse it later."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Template Name</FieldLabel>
              <Input
                id="name"
                name="name"
                defaultValue={template?.name ?? ""}
                placeholder="e.g. Welcome Message"
                className="h-11"
                required
                autoFocus
              />
              <FieldDescription>
                For your reference — not sent to recipients.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="body">Message Content</FieldLabel>
              <Textarea
                id="body"
                name="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your SMS message here..."
                className="min-h-[140px] text-base resize-y"
                maxLength={1000}
                required
              />
              <FieldDescription>
                <span className="flex items-center justify-between">
                  <span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {parts.characters}
                    </span>{" "}
                    characters ·{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {parts.parts}
                    </span>{" "}
                    SMS
                  </span>
                  <span className="font-mono text-[10px]">{parts.encoding}</span>
                </span>
              </FieldDescription>
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
                    Saving...
                  </>
                ) : (
                  <>
                    <FileText className="size-4 mr-2" />
                    {template ? "Save Changes" : "Create Template"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}