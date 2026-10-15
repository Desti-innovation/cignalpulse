"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { AuditLogRow } from "@/app/actions/admin-audit"
import {
  Search,
  ScrollText,
  Eye,
  ShieldCheck,
  ShieldX,
  Send,
  RefreshCw,
  UserCheck,
  UserX,
  KeyRound,
  LogIn,
  LogOut,
} from "lucide-react"

function actionIcon(action: string) {
  const size = "size-3.5"
  if (action.includes("approve")) return <ShieldCheck className={`${size} text-green-500`} />
  if (action.includes("reject")) return <ShieldX className={`${size} text-red-500`} />
  if (action.includes("submit")) return <Send className={`${size} text-blue-500`} />
  if (action.includes("check")) return <RefreshCw className={`${size} text-amber-500`} />
  if (action.includes("enable")) return <UserCheck className={`${size} text-green-500`} />
  if (action.includes("disable")) return <UserX className={`${size} text-red-500`} />
  if (action.includes("reset")) return <KeyRound className={`${size} text-amber-500`} />
  if (action === "admin_login") return <LogIn className={`${size} text-blue-500`} />
  if (action === "admin_logout") return <LogOut className={`${size} text-gray-500`} />
  return <ScrollText className={`${size} text-gray-400`} />
}

function actionLabel(action: string) {
  return action
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function actionColor(action: string) {
  if (action.includes("approve") || action.includes("enable"))
    return "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900"
  if (action.includes("reject") || action.includes("disable"))
    return "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900"
  if (action.includes("submit")) 
    return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900"
  if (action.includes("check") || action.includes("reset"))
    return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900"
  return "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
}

interface Props {
  logs: AuditLogRow[]
}

export function AuditLogTable({ logs }: Props) {
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<string>("all")
  const [selected, setSelected] = React.useState<AuditLogRow | null>(null)

  const actions = Array.from(new Set(logs.map((l) => l.action)))

  const filtered = logs.filter((l) => {
    if (filter !== "all" && l.action !== filter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      l.action.toLowerCase().includes(q) ||
      (l.admin_username ?? "").toLowerCase().includes(q) ||
      (l.target_type ?? "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by action, admin, or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            All
          </button>
          {actions.slice(0, 5).map((a) => (
            <button
              key={a}
              onClick={() => setFilter(a)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === a
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {actionLabel(a)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
          <ScrollText className="size-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {logs.length === 0
              ? "No admin actions recorded yet."
              : "No logs match your search/filter."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                <tr>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Action
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Admin
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Target
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    When
                  </th>
                  <th className="text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((log) => {
                  const created = new Date(log.created_at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })

                  return (
                    <tr
                      key={`log-${log.id}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${actionColor(
                            log.action
                          )}`}
                        >
                          {actionIcon(log.action)}
                          {actionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                        {log.admin_username ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs">
                        {log.target_type ? (
                          <>
                            {log.target_type}
                            {log.target_id && (
                              <span className="text-muted-foreground">
                                {" "}
                                #{log.target_id}
                              </span>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                        {created}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelected(log)}
                          className="size-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                          <Eye className="size-4" />
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

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit Event Details</DialogTitle>
            <DialogDescription>
              Full record of this admin action.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-3 text-sm">
              <DetailRow label="Action" value={actionLabel(selected.action)} />
              <DetailRow label="Admin" value={selected.admin_username ?? "—"} mono />
              <DetailRow
                label="Target"
                value={
                  selected.target_type
                    ? `${selected.target_type}${selected.target_id ? ` #${selected.target_id}` : ""}`
                    : "—"
                }
              />
              <DetailRow
                label="When"
                value={new Date(selected.created_at).toLocaleString("en-GB")}
              />

              {selected.metadata && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Metadata</p>
                  <pre className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border text-xs overflow-x-auto">
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span
        className={`text-sm font-medium text-gray-900 dark:text-gray-100 text-right truncate ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  )
}