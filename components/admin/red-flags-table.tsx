"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { RedFlagRow } from "@/app/actions/admin-red-flags"
import { clearRedFlagAction } from "@/app/actions/admin-red-flags"
import {
  MoreHorizontal,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Flag,
  Eye,
} from "lucide-react"

const reasonLabels: Record<string, string> = {
  spam_keywords: "Spam Keywords",
  low_delivery_rate: "Low Delivery Rate",
  very_low_delivery: "Very Low Delivery",
  high_opt_out_rate: "High Opt-Out Rate",
  rapid_campaigns: "Rapid Campaigns",
  high_failure_rate: "High Failure Rate",
  manual_flag: "Manually Flagged",
}

const severityColors: Record<string, string> = {
  low: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
  medium: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
  high: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900",
}

export function RedFlagsTable({ flags }: { flags: RedFlagRow[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = React.useState<number | null>(null)
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null)
  const [selected, setSelected] = React.useState<RedFlagRow | null>(null)
  const [clearing, setClearing] = React.useState<RedFlagRow | null>(null)
  const [notes, setNotes] = React.useState("")

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  const handleClear = async () => {
    if (!clearing) return
    setBusyId(clearing.id)
    const result = await clearRedFlagAction(clearing.id, notes || undefined)
    setBusyId(null)
    setClearing(null)
    setNotes("")
    if (!result.success) {
      setToast({ type: "error", message: result.error || "Clear failed." })
    } else {
      setToast({ type: "success", message: result.message || "Flag cleared." })
    }
    router.refresh()
  }

  if (flags.length === 0) {
    return (
      <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
        <CheckCircle2 className="size-12 text-green-300 dark:text-green-700 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          All clear — no active red flags.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Your users are sending normally.
        </p>
      </div>
    )
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

      <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
              <tr>
                <th className="text-left text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 font-semibold px-4 py-3">
                  User
                </th>
                <th className="text-left text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 font-semibold px-4 py-3">
                  Reason
                </th>
                <th className="text-left text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 font-semibold px-4 py-3">
                  Severity
                </th>
                <th className="text-left text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 font-semibold px-4 py-3">
                  Source
                </th>
                <th className="text-left text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 font-semibold px-4 py-3">
                  Flagged
                </th>
                <th className="text-right text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 font-semibold px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {flags.map((f) => {
                const isBusy = busyId === f.id
                const flaggedAt = new Date(f.flagged_at).toLocaleString("en-GB", {
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })
                return (
                  <tr key={`flag-${f.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {f.company_name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {f.username}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {reasonLabels[f.reason] ?? f.reason}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${severityColors[f.severity] ?? severityColors.medium}`}
                      >
                        {f.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {f.triggered_by === "auto" ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <ShieldAlert className="size-3" />
                          Auto-detected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Flag className="size-3" />
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {flaggedAt}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" disabled={isBusy} className="size-8">
                              {isBusy ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => setSelected(f)}>
                            <Eye className="size-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-green-600 dark:text-green-400 focus:text-green-700 focus:bg-green-50 dark:focus:bg-green-950/50"
                            onClick={() => setClearing(f)}
                          >
                            <CheckCircle2 className="size-4" />
                            Clear Flag
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Red Flag Details</DialogTitle>
            <DialogDescription>Full context of this flag.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Row label="User" value={`${selected.company_name} (${selected.username})`} />
              <Row label="Email" value={selected.email} />
              <Row label="Reason" value={reasonLabels[selected.reason] ?? selected.reason} />
              <Row label="Severity" value={selected.severity} />
              <Row label="Source" value={selected.triggered_by} />
              <Row label="Flagged" value={new Date(selected.flagged_at).toLocaleString("en-GB")} />
              {selected.details && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Details</p>
                  <pre className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border text-xs overflow-x-auto">
                    {JSON.stringify(selected.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Clear confirm modal */}
      <Dialog open={!!clearing} onOpenChange={(o) => !o && setClearing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Red Flag</DialogTitle>
            <DialogDescription>
              This will restore sending access for <strong>{clearing?.company_name}</strong>. The flag stays in the audit trail.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for clearing (visible only to admins)..."
              className="w-full min-h-[80px] p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setClearing(null)}>
              Cancel
            </Button>
            <Button onClick={handleClear} disabled={busyId === clearing?.id} className="bg-green-600 hover:bg-green-700 text-white gap-2">
              {busyId === clearing?.id ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Clear & Restore
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right truncate">
        {value}
      </span>
    </div>
  )
}