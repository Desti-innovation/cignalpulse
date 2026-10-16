"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  CheckCheck,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Loader2,
  Inbox,
} from "lucide-react"
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  type Notification,
  type NotificationType,
} from "@/app/actions/notifications"

interface Props {
  /** User id — for regular user dashboards */
  userId?: number
  /** Admin id — for admin panel */
  adminId?: number
  /** How often to poll for new notifications (ms). Default 30s. */
  pollMs?: number
}

const TYPE_STYLES: Record<
  NotificationType,
  { icon: React.ReactNode; ring: string; bg: string }
> = {
  info: {
    icon: <Info className="size-4 text-blue-600 dark:text-blue-400" />,
    ring: "ring-blue-200 dark:ring-blue-900",
    bg: "bg-blue-50 dark:bg-blue-950/50",
  },
  success: {
    icon: <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />,
    ring: "ring-green-200 dark:ring-green-900",
    bg: "bg-green-50 dark:bg-green-950/50",
  },
  warning: {
    icon: <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />,
    ring: "ring-amber-200 dark:ring-amber-900",
    bg: "bg-amber-50 dark:bg-amber-950/50",
  },
  error: {
    icon: <XCircle className="size-4 text-red-600 dark:text-red-400" />,
    ring: "ring-red-200 dark:ring-red-900",
    bg: "bg-red-50 dark:bg-red-950/50",
  },
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)

  const sec = Math.floor(diff / 1000)
  if (sec < 60) return "just now"
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  const wk = Math.floor(day / 7)
  if (wk < 4) return `${wk}w ago`
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })
}

export function NotificationBell({ userId, adminId, pollMs = 30_000 }: Props) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState<Notification[]>([])
  const [unread, setUnread] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [markingAll, setMarkingAll] = React.useState(false)

  const isAdmin = adminId !== undefined
  const recipientId = isAdmin ? adminId : userId

  // ---- Fetch list ----
  const refreshList = React.useCallback(async () => {
    if (recipientId === undefined) return
    setLoading(true)
    try {
      const list = isAdmin
        ? await getAdminNotifications(recipientId, 20)
        : await getNotifications(recipientId, 20)
      setItems(list)
    } catch (err) {
      console.error("[NotificationBell] list fetch failed:", err)
    } finally {
      setLoading(false)
    }
  }, [recipientId, isAdmin])

  // ---- Fetch unread count ----
  const refreshCount = React.useCallback(async () => {
    if (recipientId === undefined) return
    try {
      const n = isAdmin
        ? await getAdminUnreadCount(recipientId)
        : await getUnreadCount(recipientId)
      setUnread(n)
    } catch (err) {
      console.error("[NotificationBell] count fetch failed:", err)
    }
  }, [recipientId, isAdmin])

  // ---- Initial + polling ----
  React.useEffect(() => {
    if (recipientId === undefined) return
    void refreshCount()
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void refreshCount()
    }, pollMs)
    return () => clearInterval(id)
  }, [refreshCount, pollMs, recipientId])

  // ---- Fetch on open ----
  React.useEffect(() => {
    if (open) void refreshList()
  }, [open, refreshList])

  // ---- Visibility ----
  React.useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void refreshCount()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [refreshCount])

  const handleClick = async (n: Notification) => {
    if (!n.read_at && recipientId !== undefined) {
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x
        )
      )
      setUnread((prev) => Math.max(0, prev - 1))
      if (isAdmin) {
        void markAdminNotificationAsRead(n.id, recipientId)
      } else {
        void markAsRead(n.id, recipientId)
      }
    }

    setOpen(false)
    if (n.link) router.push(n.link)
  }

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (markingAll || unread === 0 || recipientId === undefined) return

    setMarkingAll(true)
    const now = new Date().toISOString()
    setItems((prev) => prev.map((x) => ({ ...x, read_at: x.read_at ?? now })))
    setUnread(0)
    try {
      if (isAdmin) {
        await markAllAdminNotificationsAsRead(recipientId)
      } else {
        await markAllAsRead(recipientId)
      }
    } finally {
      setMarkingAll(false)
    }
  }

  // Don't render if we have no recipient
  if (recipientId === undefined) return null

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <button
            className="relative flex items-center justify-center size-9 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors outline-none"
            aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
          />
        }
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-gray-900">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80 sm:w-96 rounded-xl p-0 overflow-hidden"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
            {unread > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                {unread} new
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={markingAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 inline-flex items-center gap-1"
            >
              {markingAll ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <CheckCheck className="size-3" />
              )}
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-gray-400" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                <Inbox className="size-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                You&apos;re all caught up
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                No notifications yet
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((n) => {
                const style = TYPE_STYLES[n.type] ?? TYPE_STYLES.info
                const isUnread = !n.read_at
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n)}
                      className={`w-full text-left px-3 py-3 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                        isUnread ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                      }`}
                    >
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ${style.bg} ${style.ring}`}
                      >
                        {style.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-tight truncate ${
                              isUnread
                                ? "font-semibold text-gray-900 dark:text-gray-100"
                                : "font-medium text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {n.title}
                          </p>
                          {isUnread && (
                            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-blue-500" />
                          )}
                        </div>
                        {n.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {n.body}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                          {relativeTime(n.created_at)}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}