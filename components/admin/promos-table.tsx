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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Promo } from "@/app/actions/admin-promos"
import type { SmsBundle } from "@/app/actions/admin-bundles"
import {
  createPromoAction,
  togglePromoActiveAction,
  deletePromoAction,
} from "@/app/actions/admin-promos"
import {
  Plus,
  TicketPercent,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
} from "lucide-react"

interface Props {
  promos: Promo[]
  bundles: SmsBundle[]
}

export function PromosTable({ promos, bundles }: Props) {
  const router = useRouter()
  const [creating, setCreating] = React.useState(false)
  const [busyId, setBusyId] = React.useState<number | null>(null)
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null)

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleToggle = async (promo: Promo) => {
    setBusyId(promo.id)
    const result = await togglePromoActiveAction(promo.id, !promo.is_active)
    setBusyId(null)
    if (!result.success) {
      setToast({ type: "error", message: result.error || "Failed." })
    } else {
      setToast({ type: "success", message: "Promo updated." })
    }
    router.refresh()
  }

  const handleDelete = async (promo: Promo) => {
    if (!confirm(`Delete promo "${promo.code}"? This cannot be undone.`)) return
    setBusyId(promo.id)
    const result = await deletePromoAction(promo.id)
    setBusyId(null)
    if (!result.success) {
      setToast({ type: "error", message: result.error || "Delete failed." })
    } else {
      setToast({ type: "success", message: "Promo deleted." })
    }
    router.refresh()
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setToast({ type: "success", message: `Copied "${code}"` })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {promos.length} promo{promos.length === 1 ? "" : "s"}
        </p>
        <Button
          onClick={() => setCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          <Plus className="size-4" />
          New Promo
        </Button>
      </div>

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

      {promos.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
          <TicketPercent className="size-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No promo codes yet.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                <tr>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Code
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Discount
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Applies To
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Uses
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Expires
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Status
                  </th>
                  <th className="text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {promos.map((p, i) => {
                  const isBusy = busyId === p.id
                  const expires = p.expires_at
                    ? new Date(p.expires_at).toLocaleDateString("en-GB")
                    : "Never"

                  return (
                    <tr key={`promo-${p.id}-${i}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => copyCode(p.code)}
                          className="flex items-center gap-2 font-mono font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 group"
                        >
                          {p.code}
                          <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-xs">
                          {p.discount_percent}% off
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs">
                        {p.bundle_name ?? "All bundles"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs">
                        {p.current_uses}
                        {p.max_uses ? ` / ${p.max_uses}` : ""}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                        {expires}
                      </td>
                      <td className="px-4 py-3">
                        <Switch
                          checked={p.is_active}
                          onCheckedChange={() => handleToggle(p)}
                          disabled={isBusy}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(p)}
                          disabled={isBusy}
                          className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                        >
                          {isBusy ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreatePromoModal
        open={creating}
        onOpenChange={setCreating}
        bundles={bundles}
        onCreated={(msg) => {
          setToast({ type: "success", message: msg })
          router.refresh()
        }}
      />
    </div>
  )
}

function CreatePromoModal({
  open,
  onOpenChange,
  bundles,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  bundles: SmsBundle[]
  onCreated: (message: string) => void
}) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [bundleId, setBundleId] = React.useState<string>("any")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set("applies_to_bundle_id", bundleId)

    const result = await createPromoAction(formData)

    if (!result.success) {
      setError(result.error || "Create failed.")
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    onOpenChange(false)
    setBundleId("any")
    onCreated(result.message || "Promo created.")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Promo Code</DialogTitle>
          <DialogDescription>
            Create a discount code customers can use when purchasing a bundle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="code">Promo Code</FieldLabel>
              <Input
                id="code"
                name="code"
                placeholder="e.g. BLACKFRIDAY20"
                className="font-mono uppercase"
                required
              />
              <FieldDescription>Letters and numbers only. Case-insensitive.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="discount_percent">Discount %</FieldLabel>
              <Input
                id="discount_percent"
                name="discount_percent"
                type="number"
                min={1}
                max={100}
                defaultValue={10}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="applies_to_bundle_id">Applies To</FieldLabel>
              <Select value={bundleId} onValueChange={(v) => setBundleId(v ?? "any")}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">All bundles</SelectItem>
                  {bundles.map((b) => (
                    <SelectItem key={`bundle-opt-${b.id}`} value={String(b.id)}>
                      {b.name} (₵{b.price_ghs})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="max_uses">Max Uses</FieldLabel>
                <Input
                  id="max_uses"
                  name="max_uses"
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="expires_at">Expires</FieldLabel>
                <Input
                  id="expires_at"
                  name="expires_at"
                  type="date"
                />
              </Field>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200">
                <AlertCircle className="size-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
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
              <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Promo"
                )}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}