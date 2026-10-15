"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AdminCampaignRow,
  syncCampaignAction,
} from "@/app/actions/admin-campaigns"
import {
  MoreHorizontal,
  Search,
  Send,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

function statusPill(status: string) {
  const cfg: Record<string, { label: string; cls: string }> = {
    sent: {
      label: "Sent",
      cls: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900",
    },
    scheduled: {
      label: "Scheduled",
      cls: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
    },
    failed: {
      label: "Failed",
      cls: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900",
    },
  }
  const c = cfg[status] ?? cfg.sent
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${c.cls}`}
    >
      {c.label}
    </span>
  )
}

interface Props {
  campaigns: AdminCampaignRow[]
}

export function CampaignsTable({ campaigns }: Props) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<"all" | "sent" | "scheduled" | "failed">("all")
  const [busyId, setBusyId] = React.useState<number | null>(null)
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(
    null
  )

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = campaigns.filter((c) => {
    if (filter !== "all" && c.status !== filter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.sender_id.toLowerCase().includes(q) ||
      c.company_name.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q) ||
      c.message.toLowerCase().includes(q) ||
      c.campaign_id.toLowerCase().includes(q)
    )
  })

  const handleSync = async (id: number) => {
    setBusyId(id)
    const result = await syncCampaignAction(id)
    setBusyId(null)
    if (!result.success) {
      setToast({ type: "error", message: result.error || "Sync failed." })
    } else {
      setToast({ type: "success", message: result.message || "Synced." })
    }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by sender, company, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {(["all", "sent", "scheduled", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize
                ${filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}
              `}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`
            flex items-start gap-3 p-4 rounded-lg border
            ${toast.type === "success"
              ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900 text-green-800 dark:text-green-200"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200"}
          `}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
          <Send className="size-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {campaigns.length === 0
              ? "No campaigns have been sent yet."
              : "No campaigns match your search/filter."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Sender
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Customer
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Message
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Recipients
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Delivery
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
                {filtered.map((c) => {
                  const isBusy = busyId === c.id
                  const sentAt = c.sent_at
                    ? new Date(c.sent_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : c.scheduled_at
                    ? `Scheduled: ${new Date(c.scheduled_at).toLocaleDateString("en-GB")}`
                    : "—"

                  const deliveryPct =
                    c.total_sent > 0
                      ? Math.round((c.total_delivered / c.total_sent) * 100)
                      : 0

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-gray-900 dark:text-gray-100 text-xs">
                        {c.sender_id}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[180px] truncate">
                        {c.company_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[240px] truncate text-xs">
                        {c.message}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs">
                        {c.recipient_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${deliveryPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {deliveryPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{statusPill(c.status)}</td>
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
                              disabled={isBusy}
                              onClick={() => handleSync(c.id)}
                            >
                              <RefreshCw className="size-4" />
                              Sync Delivery Report
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
      )}
    </div>
  )
}