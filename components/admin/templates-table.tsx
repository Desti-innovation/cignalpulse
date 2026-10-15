"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import type { PlatformTemplate } from "@/app/actions/admin-templates"
import {
  updateTemplateAction,
  toggleTemplateAction,
} from "@/app/actions/admin-templates"
import { Mail, MessageSquare, Pencil, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export function TemplatesTable({ templates }: { templates: PlatformTemplate[] }) {
  const router = useRouter()
  const [editing, setEditing] = React.useState<PlatformTemplate | null>(null)
  const [busyId, setBusyId] = React.useState<number | null>(null)
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null)

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleToggle = async (tpl: PlatformTemplate) => {
    setBusyId(tpl.id)
    await toggleTemplateAction(tpl.id, !tpl.is_active)
    setBusyId(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg border ${
            toast.type === "success"
              ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900 text-green-800 dark:text-green-200"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((tpl, i) => (
          <div
            key={`tpl-${tpl.id}-${i}`}
            className={`rounded-xl border p-5 ${
              tpl.is_active
                ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div
                  className={`flex size-9 items-center justify-center rounded-lg shrink-0 ${
                    tpl.channel === "email"
                      ? "bg-blue-50 dark:bg-blue-950/40"
                      : "bg-purple-50 dark:bg-purple-950/40"
                  }`}
                >
                  {tpl.channel === "email" ? (
                    <Mail className="size-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <MessageSquare className="size-4 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {tpl.code}
                  </p>
                </div>
              </div>
              <Switch
                checked={tpl.is_active}
                onCheckedChange={() => handleToggle(tpl)}
                disabled={busyId === tpl.id}
              />
            </div>

            {tpl.subject && (
              <p className="text-xs text-muted-foreground mb-2">
                <span className="font-medium">Subject:</span> {tpl.subject}
              </p>
            )}

            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
              {tpl.body}
            </p>

            {tpl.description && (
              <p className="text-[10px] text-muted-foreground italic mb-3">
                {tpl.description}
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => setEditing(tpl)}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          </div>
        ))}
      </div>

      <EditTemplateModal
        template={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={(msg) => {
          setToast({ type: "success", message: msg })
          setEditing(null)
          router.refresh()
        }}
      />
    </div>
  )
}

function EditTemplateModal({
  template,
  onOpenChange,
  onSaved,
}: {
  template: PlatformTemplate | null
  onOpenChange: (open: boolean) => void
  onSaved: (message: string) => void
}) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!template) return
    setIsSaving(true)
    setError(null)

    const result = await updateTemplateAction(template.id, new FormData(e.currentTarget))
    if (!result.success) {
      setError(result.error || "Save failed.")
      setIsSaving(false)
      return
    }
    setIsSaving(false)
    onOpenChange(false)
    onSaved(result.message || "Saved.")
  }

  return (
    <Dialog open={!!template} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
          <DialogDescription>
            Use placeholders in square brackets, e.g. <code className="text-xs">[company]</code>.
          </DialogDescription>
        </DialogHeader>

        {template && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input name="name" defaultValue={template.name} required />
              </Field>

              {template.channel === "email" && (
                <Field>
                  <FieldLabel>Subject</FieldLabel>
                  <Input name="subject" defaultValue={template.subject ?? ""} />
                </Field>
              )}

              <Field>
                <FieldLabel>Body</FieldLabel>
                <textarea
                  name="body"
                  defaultValue={template.body}
                  rows={6}
                  required
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FieldDescription>
                  Common placeholders: [company], [username], [amount], [reason], [link]
                </FieldDescription>
              </Field>

              {error && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium">{error}</p>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}