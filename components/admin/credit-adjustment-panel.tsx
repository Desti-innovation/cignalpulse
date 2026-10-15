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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { CreditAdjustment } from "@/app/actions/admin-credit-adjustments"
import { adjustCreditsAction } from "@/app/actions/admin-credit-adjustments"
import {
  Plus,
  Minus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  History,
  Coins,
} from "lucide-react"

interface Props {
  userId: number
  currentCredits: number
  adjustments: CreditAdjustment[]
}

export function CreditAdjustmentPanel({ userId, currentCredits, adjustments }: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = React.useState(false)
  const [modalType, setModalType] = React.useState<"credit" | "debit">("credit")
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [toast, setToast] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const openModal = (type: "credit" | "debit") => {
    setModalType(type)
    setError(null)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set("adjustment_type", modalType)

    const result = await adjustCreditsAction(userId, formData)

    if (!result.success) {
      setError(result.error || "Failed.")
      setIsSaving(false)
      return
    }

    setModalOpen(false)
    setIsSaving(false)
    setToast(result.message || "Adjustment applied.")
    router.refresh()
  }

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Coins className="size-4 text-amber-600" />
            Credit Adjustments
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Current balance: <strong>{currentCredits.toLocaleString()}</strong> credits
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModal("debit")}
            className="gap-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Minus className="size-3.5" />
            Debit
          </Button>
          <Button
            size="sm"
            onClick={() => openModal("credit")}
            className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="size-3.5" />
            Credit
          </Button>
        </div>
      </div>

      {toast && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-800 dark:text-green-200 mb-4">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          <p className="text-xs font-medium">{toast}</p>
        </div>
      )}

      {adjustments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          No manual adjustments yet.
        </p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {adjustments.slice(0, 20).map((a, i) => (
            <div
              key={`adj-${a.id}-${i}`}
              className="flex items-start justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="flex items-start gap-2 min-w-0">
                <div
                  className={`flex size-7 items-center justify-center rounded-md shrink-0 ${
                    a.adjustment_type === "credit"
                      ? "bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                  }`}
                >
                  {a.adjustment_type === "credit" ? (
                    <Plus className="size-3.5" />
                  ) : (
                    <Minus className="size-3.5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {a.reason}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {a.admin_username ? `by ${a.admin_username} • ` : ""}
                    {new Date(a.created_at).toLocaleDateString("en-GB")}
                  </p>
                </div>
              </div>
              <span
                className={`text-sm font-bold shrink-0 ${
                  a.adjustment_type === "credit"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {a.adjustment_type === "credit" ? "+" : "-"}
                {a.amount}
              </span>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalType === "credit" ? "Credit" : "Debit"} Credits
            </DialogTitle>
            <DialogDescription>
              Manually {modalType === "credit" ? "add" : "remove"} SMS credits from this user's
              wallet. This is logged in the audit trail.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="amount">Amount (credits)</FieldLabel>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min={1}
                  placeholder="e.g. 500"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="reason">Reason</FieldLabel>
                <Input
                  id="reason"
                  name="reason"
                  placeholder="e.g. Refund for failed campaign"
                  required
                  minLength={3}
                />
                <FieldDescription>
                  Visible in the adjustment history. Be specific.
                </FieldDescription>
              </Field>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium">{error}</p>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className={
                    modalType === "credit"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <History className="size-4 mr-2" />
                      Apply Adjustment
                    </>
                  )}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}