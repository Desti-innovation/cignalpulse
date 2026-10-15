"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  SenderIdRequestRow,
  submitToGatewayAction,
  checkGatewayStatusAction,
  approveForUserAction,
  rejectRequestAction,
} from "@/app/actions/admin-sender-ids"
import {
  MoreHorizontal,
  Send,
  RefreshCw,
  Check,
  X,
  Eye,
  Search,
  Inbox,
  Loader2,
  Copy,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react"

// ---------- Status Badge ----------

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    pending: {
      label: "Pending",
      cls: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
      icon: <Clock className="size-3" />,
    },
    submitted: {
      label: "Submitted",
      cls: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
      icon: <Send className="size-3" />,
    },
    approved: {
      label: "Approved",
      cls: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900",
      icon: <CheckCircle2 className="size-3" />,
    },
    rejected: {
      label: "Rejected",
      cls: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900",
      icon: <X className="size-3" />,
    },
  }

  const c = config[status] ?? config.pending
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.cls}`}
    >
      {c.icon}
      {c.label}
    </span>
  )
}

// ---------- Main Component ----------

interface Props {
  requests: SenderIdRequestRow[]
}

export function SenderIdRequestsTable({ requests }: Props) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<string>("all")
  const [busyId, setBusyId] = React.useState<number | null>(null)
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null)
  const [credentials, setCredentials] = React.useState<{ username: string; password: string } | null>(null)

  // Auto-hide toast
  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  // Filter + search
  const filtered = requests.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.request_id.toLowerCase().includes(q) ||
      r.sender_id.toLowerCase().includes(q) ||
      r.company_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q)
    )
  })

  // Action handler
  const runAction = async (
    id: number,
    action: () => Promise<{ success: boolean; message?: string; error?: string }>
  ) => {
    setBusyId(id)
    const result = await action()
    setBusyId(null)

    if (!result.success) {
      setToast({ type: "error", message: result.error || "Action failed." })
      return
    }

    // Extract credentials if the approve action returned them
    if (result.message && result.message.startsWith("User created:")) {
      const match = result.message.match(/User created:\s*(\S+)\s*\(password:\s*(\S+)\)/)
      if (match) {
        setCredentials({ username: match[1], password: match[2] })
      }
    } else {
      setToast({ type: "success", message: result.message || "Success." })
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
            placeholder="Search by Request ID, Sender ID, Company, or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {(["all", "pending", "submitted", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize
                ${filter === s
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}
              `}
            >
              {s}
              {s !== "all" && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  {requests.filter((r) => r.status === s).length}
                </span>
              )}
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
          <Inbox className="size-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {requests.length === 0
              ? "No Sender ID requests yet."
              : "No requests match your search/filter."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Request ID
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Sender ID
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Company
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Email
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Status
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Submitted
                  </th>
                  <th className="text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((r) => {
                  const isBusy = busyId === r.id
                  const isResolved = r.status === "approved" || r.status === "rejected"
                  const submitted = new Date(r.submitted_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                        {r.request_id}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-gray-900 dark:text-gray-100">
                        {r.sender_id}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                        {r.company_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[220px] truncate">
                        {r.email}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                        {submitted}
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

                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              disabled={isBusy}
                              onClick={() =>
                                runAction(r.id, () => checkGatewayStatusAction(r.id))
                              }
                            >
                              <RefreshCw className="size-4" />
                              Check Network Status
                            </DropdownMenuItem>

                            {r.status === "pending" && (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                disabled={isBusy}
                                onClick={() =>
                                  runAction(r.id, () => submitToGatewayAction(r.id))
                                }
                              >
                                <Send className="size-4" />
                                Submit to Network
                              </DropdownMenuItem>
                            )}

                            {r.status === "submitted" && (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                disabled={isBusy}
                                onClick={() =>
                                  runAction(r.id, () => submitToGatewayAction(r.id))
                                }
                              >
                                <Send className="size-4" />
                                Re-submit
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="cursor-pointer text-green-600 dark:text-green-400 focus:text-green-700 focus:bg-green-50 dark:focus:bg-green-950/50"
                              disabled={isBusy || isResolved}
                              onClick={() =>
                                runAction(r.id, () => approveForUserAction(r.id))
                              }
                            >
                              <Check className="size-4" />
                              Approve for User
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/50"
                              disabled={isBusy || isResolved}
                              onClick={() =>
                                runAction(r.id, () => rejectRequestAction(r.id))
                              }
                            >
                              <X className="size-4" />
                              Reject Request
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

      {/* Credentials Modal (only when a user is created) */}
      <Dialog open={!!credentials} onOpenChange={(open) => !open && setCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Created Successfully</DialogTitle>
            <DialogDescription>
              ⚠️ Copy these credentials now. The password will not be shown again.
            </DialogDescription>
          </DialogHeader>

          {credentials && (
            <div className="space-y-3 py-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border">
                <p className="text-xs text-muted-foreground mb-1">Username</p>
                <p className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                  {credentials.username}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border">
                <p className="text-xs text-muted-foreground mb-1">Password</p>
                <p className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                  {credentials.password}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => {
                if (credentials) {
                  navigator.clipboard.writeText(
                    `Username: ${credentials.username}\nPassword: ${credentials.password}`
                  )
                }
                setCredentials(null)
              }}
              className="gap-2"
            >
              <Copy className="size-4" />
              Copy & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}