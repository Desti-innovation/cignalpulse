"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  AdminUserRow,
  toggleUserActiveAction,
  resetUserPasswordAction,
} from "@/app/actions/admin-users"
import {
  MoreHorizontal,
  Search,
  Users as UsersIcon,
  Loader2,
  Copy,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  UserX,
  RefreshCw,
  Eye,
} from "lucide-react"

// ---------- Helpers ----------

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function StatusPill({
  active,
  firstLogin,
  profileCompleted,
}: {
  active: boolean
  firstLogin: boolean
  profileCompleted: boolean
}) {
  if (!active) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900">
        <UserX className="size-3" />
        Disabled
      </span>
    )
  }
  if (firstLogin) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900">
        <AlertCircle className="size-3" />
        Pending Password
      </span>
    )
  }
  if (!profileCompleted) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900">
        <AlertCircle className="size-3" />
        Profile Incomplete
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900">
      <CheckCircle2 className="size-3" />
      Active
    </span>
  )
}

// ---------- Main Component ----------

interface Props {
  users: AdminUserRow[]
}

export function UsersTable({ users }: Props) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<"all" | "active" | "disabled" | "pending">(
    "all"
  )
  const [busyId, setBusyId] = React.useState<number | null>(null)
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null)
  const [passwordModal, setPasswordModal] = React.useState<{
    username: string
    password: string
  } | null>(null)

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = users.filter((u) => {
    if (filter === "active" && !u.is_active) return false
    if (filter === "disabled" && u.is_active) return false
    if (filter === "pending" && !u.first_login && u.profile_completed) return false

    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.company_name.toLowerCase().includes(q) ||
      (u.display_name ?? "").toLowerCase().includes(q)
    )
  })

  const runAction = async (
    id: number,
    action: () => Promise<{ success: boolean; message?: string; error?: string; password?: string }>
  ) => {
    setBusyId(id)
    const result = await action()
    setBusyId(null)

    if (!result.success) {
      setToast({ type: "error", message: result.error || "Action failed." })
      return
    }

    // Password reset shows a modal instead of a toast
    if (result.password) {
      const user = users.find((u) => u.id === id)
      setPasswordModal({
        username: user?.username ?? "",
        password: result.password,
      })
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
            placeholder="Search by username, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {(["all", "active", "disabled", "pending"] as const).map((f) => (
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
          <UsersIcon className="size-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {users.length === 0
              ? "No users have been created yet."
              : "No users match your search/filter."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    User
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Company
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Sender ID
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Status
                  </th>
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Created
                  </th>
                  <th className="text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((u) => {
                  const isBusy = busyId === u.id
                  const displayName = u.display_name || u.company_name
                  const initials = initialsOf(displayName)
                  const created = new Date(u.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 rounded-lg">
                            {u.logo_url ? (
                              <AvatarImage src={u.logo_url} alt={displayName} />
                            ) : null}
                            <AvatarFallback className="rounded-lg bg-blue-600 text-white text-xs font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-mono font-semibold text-gray-900 dark:text-gray-100 text-xs truncate">
                              {u.username}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                        {displayName}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                        {u.sender_id ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill
                          active={u.is_active}
                          firstLogin={u.first_login}
                          profileCompleted={u.profile_completed}
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                        {created}
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
                                window.open(
                                  `/admin/users/${u.id}`,
                                  "_blank",
                                  "noopener,noreferrer"
                                )
                              }
                            >
                              <Eye className="size-4" />
                              View Details
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="cursor-pointer"
                              disabled={isBusy}
                              onClick={() =>
                                runAction(u.id, () => resetUserPasswordAction(u.id))
                              }
                            >
                              <RefreshCw className="size-4" />
                              Reset Password
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {u.is_active ? (
                              <DropdownMenuItem
                                className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/50"
                                disabled={isBusy}
                                onClick={() =>
                                  runAction(u.id, () => toggleUserActiveAction(u.id, false))
                                }
                              >
                                <UserX className="size-4" />
                                Disable Account
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="cursor-pointer text-green-600 dark:text-green-400 focus:text-green-700 focus:bg-green-50 dark:focus:bg-green-950/50"
                                disabled={isBusy}
                                onClick={() =>
                                  runAction(u.id, () => toggleUserActiveAction(u.id, true))
                                }
                              >
                                <UserCheck className="size-4" />
                                Enable Account
                              </DropdownMenuItem>
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

      {/* Password Reset Modal */}
      <Dialog open={!!passwordModal} onOpenChange={(open) => !open && setPasswordModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset</DialogTitle>
            <DialogDescription>
              A new password has been generated for{" "}
              <strong>{passwordModal?.username}</strong>. Copy it now — it will not be shown again.
              The user will be prompted to change it on next login.
            </DialogDescription>
          </DialogHeader>

          {passwordModal && (
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border">
              <p className="text-xs text-muted-foreground mb-1">New Password</p>
              <p className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                {passwordModal.password}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => {
                if (passwordModal) {
                  navigator.clipboard.writeText(passwordModal.password)
                }
                setPasswordModal(null)
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