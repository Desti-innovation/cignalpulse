"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { TransactionRow } from "@/app/actions/admin-transactions"
import { refundTransactionAction } from "@/app/actions/admin-transactions"
import {
  MoreHorizontal,
  Search,
  Loader2,
  Eye,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Receipt,
  Wallet,
  Package,
} from "lucide-react"

function statusPill(status: string) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    success: {
      label: "Success",
      cls: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900",
      icon: <CheckCircle2 className="size-3" />,
    },
    pending: {
      label: "Pending",
      cls: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
      icon: <Clock className="size-3" />,
    },
    failed: {
      label: "Failed",
      cls: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900",
      icon: <XCircle className="size-3" />,
    },
    refunded: {
      label: "Refunded",
      cls: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
      icon: <RotateCcw className="size-3" />,
    },
  }
  const c = cfg[status] ?? cfg.pending
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.cls}`}
    >
      {c.icon}
      {c.label}
    </span>
  )
}

function typePill(type: string) {
  if (type === "wallet_topup") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
        <Wallet className="size-3" />
        Top-up
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
      <Package className="size-3" />
      Bundle
    </span>
  )
}

interface Props {
  transactions: TransactionRow[]
}

export function TransactionsTable({ transactions }: Props) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<"all" | "wallet_topup" | "bundle_purchase">("all")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "success" | "pending" | "failed" | "refunded">("all")
  const [busyId, setBusyId] = React.useState<number | null>(null)
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null)
  const [selected, setSelected] = React.useState<TransactionRow | null>(null)

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = transactions.filter((t) => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false
    if (statusFilter !== "all" && t.status !== statusFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.reference.toLowerCase().includes(q) ||
      t.username.toLowerCase().includes(q) ||
      t.company_name.toLowerCase().includes(q) ||
      (t.bundle_name ?? "").toLowerCase().includes(q)
    )
  })

  const handleRefund = async (id: number) => {
    if (!confirm("Refund this transaction? The user's wallet balance will be reduced.")) return
    setBusyId(id)
    const result = await refundTransactionAction(id)
    setBusyId(null)
    if (!result.success) {
      setToast({ type: "error", message: result.error || "Refund failed." })
    } else {
      setToast({ type: "success", message: result.message || "Refunded." })
    }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by reference, user, or bundle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(["all", "wallet_topup", "bundle_purchase"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  typeFilter === t
                    ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                {t === "all" ? "All Types" : t === "wallet_topup" ? "Top-ups" : "Bundles"}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(["all", "success", "pending", "failed", "refunded"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                  statusFilter === s
                    ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
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

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
          <Receipt className="size-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {transactions.length === 0
              ? "No transactions yet."
              : "No transactions match your search/filter."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Reference
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Type
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Customer
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Amount
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Status
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Date
                  </th>
                  <th className="text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((t) => {
                  const isBusy = busyId === t.id
                  const date = new Date(t.initiated_at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })

                  return (
                    <tr
                      key={`tx-${t.id}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                        {t.reference}
                      </td>
                      <td className="px-4 py-3">{typePill(t.type)}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[180px] truncate">
                        {t.company_name}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                        ₵{t.amount_ghs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">{statusPill(t.status)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {date}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isBusy}
                                className="size-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                              />
                            }
                          >
                            {isBusy ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="size-4" />
                            )}
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => setSelected(t)}
                            >
                              <Eye className="size-4" />
                              View Details                            </DropdownMenuItem>

                            {t.status === "success" && t.type === "wallet_topup" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/50"
                                  disabled={isBusy}
                                  onClick={() => handleRefund(t.id)}
                                >
                                  <RotateCcw className="size-4" />
                                  Refund
                                </DropdownMenuItem>
                              </>
                            )}
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
      )}

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>Full record of this transaction.</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-3 text-sm">
              <Row label="Reference" value={selected.reference} mono />
              <Row label="Type" value={selected.type === "wallet_topup" ? "Wallet Top-up" : "Bundle Purchase"} />
              <Row label="Customer" value={`${selected.company_name} (${selected.username})`} />
              <Row
                label="Amount"
                value={`₵${selected.amount_ghs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`}
              />
              {selected.original_amount_ghs &&
                selected.original_amount_ghs !== selected.amount_ghs && (
                  <Row
                    label="Original"
                    value={`₵${selected.original_amount_ghs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`}
                  />
                )}
              {selected.bundle_name && <Row label="Bundle" value={selected.bundle_name} />}
              {selected.promo_code && <Row label="Promo" value={selected.promo_code} />}
              <Row label="Credits" value={selected.credits.toLocaleString()} />
              {selected.bonus_credits > 0 && (
                <Row label="Bonus" value={selected.bonus_credits.toLocaleString()} />
              )}
              {selected.gateway && <Row label="Gateway" value={selected.gateway} />}
              <Row label="Status" value={selected.status} />
              <Row
                label="Initiated"
                value={new Date(selected.initiated_at).toLocaleString("en-GB")}
              />
              {selected.completed_at && (
                <Row
                  label="Completed"
                  value={new Date(selected.completed_at).toLocaleString("en-GB")}
                />
              )}
              {selected.refunded_at && (
                <Row
                  label="Refunded"
                  value={new Date(selected.refunded_at).toLocaleString("en-GB")}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span
        className={`text-sm font-medium text-gray-900 dark:text-gray-100 text-right truncate ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  )
}