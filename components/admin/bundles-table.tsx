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
  FieldDescription,
} from "@/components/ui/field"
import type { SmsBundle, BundleType } from "@/app/actions/admin-bundles"
import {
  createBundleAction,
  updateBundleAction,
  toggleBundleActiveAction,
} from "@/app/actions/admin-bundles"
import {
  Plus,
  Package,
  Loader2,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Clock,
  Infinity as InfinityIcon,
} from "lucide-react"

interface Props {
  bundles: SmsBundle[]
}

export function BundlesTable({ bundles }: Props) {
  const router = useRouter()
  const [editing, setEditing] = React.useState<SmsBundle | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [busyId, setBusyId] = React.useState<number | null>(null)
  const [toast, setToast] = React.useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [filter, setFilter] = React.useState<"all" | BundleType>("all")

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleToggle = async (bundle: SmsBundle) => {
    setBusyId(bundle.id)
    const result = await toggleBundleActiveAction(bundle.id, !bundle.is_active)
    setBusyId(null)
    if (!result.success) {
      setToast({ type: "error", message: result.error || "Failed." })
    } else {
      setToast({
        type: "success",
        message: bundle.is_active ? "Bundle deactivated." : "Bundle activated.",
      })
    }
    router.refresh()
  }

  const filtered = bundles.filter((b) => {
    if (filter === "all") return true
    return b.bundle_type === filter
  })

  const grouped = {
    non_expiry: filtered.filter((b) => b.bundle_type === "non_expiry"),
    expiry: filtered.filter((b) => b.bundle_type === "expiry"),
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          {(["all", "non_expiry", "expiry"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }
              `}
            >
              {f === "all"
                ? `All (${bundles.length})`
                : f === "non_expiry"
                ? `Non-Expiry (${bundles.filter((b) => b.bundle_type === "non_expiry").length})`
                : `Expiry (${bundles.filter((b) => b.bundle_type === "expiry").length})`}
            </button>
          ))}
        </div>

        <Button
          onClick={() => setCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          <Plus className="size-4" />
          New Bundle
        </Button>
      </div>

      {/* Toast */}
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

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
          <Package className="size-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {bundles.length === 0
              ? "No bundles yet."
              : "No bundles match your filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.non_expiry.length > 0 && (
            <Section
              title="Non-Expiry Bundles"
              subtitle="Credits never expire — best for steady senders."
              badge={{
                label: "Never Expires",
                icon: <InfinityIcon className="size-3" />,
                cls: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
              }}
              bundles={grouped.non_expiry}
              busyId={busyId}
              onToggle={handleToggle}
              onEdit={setEditing}
            />
          )}

          {grouped.expiry.length > 0 && (
            <Section
              title="Expiry Bundles"
              subtitle="30-day validity — cheaper per SMS but must be used in time."
              badge={{
                label: "30 Days",
                icon: <Clock className="size-3" />,
                cls: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
              }}
              bundles={grouped.expiry}
              busyId={busyId}
              onToggle={handleToggle}
              onEdit={setEditing}
            />
          )}
        </div>
      )}

      {/* Create modal */}
      <BundleFormModal
        open={creating}
        onOpenChange={setCreating}
        onSaved={(msg) => {
          setToast({ type: "success", message: msg })
          router.refresh()
        }}
      />

      {/* Edit modal */}
      <BundleFormModal
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        bundle={editing}
        onSaved={(msg) => {
          setToast({ type: "success", message: msg })
          setEditing(null)
          router.refresh()
        }}
      />
    </div>
  )
}

// ============================================================
// Section
// ============================================================

function Section({
  title,
  subtitle,
  badge,
  bundles,
  busyId,
  onToggle,
  onEdit,
}: {
  title: string
  subtitle: string
  badge: { label: string; icon: React.ReactNode; cls: string }
  bundles: SmsBundle[]
  busyId: number | null
  onToggle: (b: SmsBundle) => void
  onEdit: (b: SmsBundle) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}
        >
          {badge.icon}
          {badge.label}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {bundles.map((b, i) => (
          <BundleCard
            key={`bundle-${b.id}-${i}`}
            bundle={b}
            isBusy={busyId === b.id}
            onToggle={() => onToggle(b)}
            onEdit={() => onEdit(b)}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Bundle Card (Variant A — subtle amber on expiry)
// ============================================================

function BundleCard({
  bundle,
  isBusy,
  onToggle,
  onEdit,
}: {
  bundle: SmsBundle
  isBusy: boolean
  onToggle: () => void
  onEdit: () => void
}) {
  const perSms = bundle.credits > 0 ? bundle.price_ghs / bundle.credits : 0
  const isExpiry = bundle.bundle_type === "expiry"

  // Color tokens that switch based on bundle type
  const cardClasses = `
    rounded-xl border p-5 transition-all
    ${bundle.is_active ? "" : "opacity-60"}
    ${
      isExpiry
        ? "bg-amber-50/30 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/50"
        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
    }
  `

  const priceColor = isExpiry
    ? "text-amber-600 dark:text-amber-400"
    : "text-blue-600 dark:text-blue-400"

  const perSmsColor = isExpiry
    ? "text-amber-700/70 dark:text-amber-400/70"
    : "text-gray-500 dark:text-gray-400"

  return (
    <div className={cardClasses}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {bundle.name}
          </h3>
          {isExpiry && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <Clock className="size-2.5" />
              {bundle.validity_days}D
            </span>
          )}
        </div>
        <Switch
          checked={bundle.is_active}
          onCheckedChange={onToggle}
          disabled={isBusy}
        />
      </div>

      <div className="space-y-1 mb-4">
        <p className={`text-3xl font-bold ${priceColor}`}>
          ₵
          {bundle.price_ghs.toLocaleString("en-GH", {
            minimumFractionDigits: 2,
          })}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">
            {bundle.credits.toLocaleString()}
          </span>{" "}
          SMS
          {bundle.bonus_credits > 0 && (
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-medium">
              +{bundle.bonus_credits.toLocaleString()} bonus
            </span>
          )}
        </p>
        <p className={`text-xs font-mono ${perSmsColor}`}>
          ₵{perSms.toFixed(3)} per SMS
        </p>
      </div>

      {bundle.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
          {bundle.description}
        </p>
      )}

      <Button
        variant="outline"
        size="sm"
        className={`w-full gap-2 ${
          isExpiry
            ? "border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            : ""
        }`}
        onClick={onEdit}
      >
        <Pencil className="size-3.5" />
        Edit
      </Button>
    </div>
  )
}

// ============================================================
// Create/Edit Modal
// ============================================================

function BundleFormModal({
  open,
  onOpenChange,
  bundle,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  bundle?: SmsBundle | null
  onSaved: (message: string) => void
}) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [bundleType, setBundleType] = React.useState<BundleType>(
    bundle?.bundle_type ?? "non_expiry"
  )

  React.useEffect(() => {
    setBundleType(bundle?.bundle_type ?? "non_expiry")
    setError(null)
  }, [bundle, open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set("bundle_type", bundleType)

    const result = bundle
      ? await updateBundleAction(bundle.id, formData)
      : await createBundleAction(formData)

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{bundle ? "Edit Bundle" : "New Bundle"}</DialogTitle>
          <DialogDescription>
            {bundle
              ? "Update the pricing and details of this bundle."
              : "Create a new SMS bundle for your customers to purchase."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Bundle Name</FieldLabel>
              <Input
                id="name"
                name="name"
                defaultValue={bundle?.name ?? ""}
                placeholder="e.g. Silver"
                required
              />
            </Field>

            <Field>
              <FieldLabel>Bundle Type</FieldLabel>
              <Select
                value={bundleType}
                onValueChange={(v) => setBundleType(v as BundleType)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="non_expiry">
                    Non-Expiry (never expires)
                  </SelectItem>
                  <SelectItem value="expiry">
                    Expiry (validity window)
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>
                {bundleType === "expiry"
                  ? "Credits will expire N days after purchase."
                  : "Credits stay in the user's wallet indefinitely."}
              </FieldDescription>
            </Field>

            {bundleType === "expiry" && (
              <Field>
                <FieldLabel htmlFor="validity_days">Validity (days)</FieldLabel>
                <Input
                  id="validity_days"
                  name="validity_days"
                  type="number"
                  min={1}
                  defaultValue={bundle?.validity_days ?? 30}
                  required
                />
                <FieldDescription>
                  Number of days before the credits expire.
                </FieldDescription>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="credits">Credits</FieldLabel>
                <Input
                  id="credits"
                  name="credits"
                  type="number"
                  min={1}
                  defaultValue={bundle?.credits ?? 1000}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="bonus_credits">Bonus Credits</FieldLabel>
                <Input
                  id="bonus_credits"
                  name="bonus_credits"
                  type="number"
                  min={0}
                  defaultValue={bundle?.bonus_credits ?? 0}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="price_ghs">Price (GHS)</FieldLabel>
                <Input
                  id="price_ghs"
                  name="price_ghs"
                  type="number"
                  step="0.01"
                  min={0.01}
                  defaultValue={bundle?.price_ghs ?? 30}
                  required
                />
                <FieldDescription>
                  Per-SMS rate calculates automatically.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="sort_order">Sort Order</FieldLabel>
                <Input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  defaultValue={bundle?.sort_order ?? 0}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Input
                id="description"
                name="description"
                defaultValue={bundle?.description ?? ""}
                placeholder="Brief description of this bundle"
              />
              <FieldDescription>
                Optional. Shown on the customer's purchase page.
              </FieldDescription>
            </Field>

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
                ) : bundle ? (
                  "Save Changes"
                ) : (
                  "Create Bundle"
                )}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}