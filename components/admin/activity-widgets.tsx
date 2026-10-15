"use client"

import * as React from "react"
import Link from "next/link"
import {
  Activity,
  AlertCircle,
  Inbox,
  Flag,
  XCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react"
import type { RecentActivity, AttentionItems } from "@/app/actions/admin-activity"

const actionLabels: Record<string, string> = {
  approve_sender_id: "Approved a Sender ID",
  reject_sender_id: "Rejected a Sender ID",
  submit_sender_id: "Submitted a Sender ID",
  check_sender_id_status: "Checked Sender ID status",
  enable_user: "Enabled a user",
  disable_user: "Disabled a user",
  reset_user_password: "Reset a password",
  sync_campaign: "Synced a campaign",
  admin_login: "Logged in",
  admin_logout: "Logged out",
}

// ============================================================
// Needs Attention Widget
// ============================================================

export function AttentionWidget({ data }: { data: AttentionItems }) {
  const items = [
    {
      show: data.pendingSenderIds > 0,
      label: "Pending Sender ID requests",
      count: data.pendingSenderIds,
      href: "/admin/sender-ids",
      icon: Inbox,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      show: data.activeRedFlags > 0,
      label: "Active red flags",
      count: data.activeRedFlags,
      href: "/admin/red-flags",
      icon: Flag,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/40",
    },
    {
      show: data.failedTransactions > 0,
      label: "Failed transactions (7d)",
      count: data.failedTransactions,
      href: "/admin/transactions",
      icon: XCircle,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
  ].filter((i) => i.show)

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="size-4 text-amber-600" />
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          Needs Attention
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6">
          <CheckCircle2 className="size-10 text-green-300 dark:text-green-700 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            All clear — nothing needs your attention.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <Link
                key={`attention-${i}`}
                href={item.href}
                className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-9 items-center justify-center rounded-lg ${item.bg}`}
                  >
                    <Icon className={`size-4 ${item.color}`} />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.label}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${item.color}`}>
                    {item.count}
                  </span>
                  <ArrowRight className="size-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Recent Activity Widget
// ============================================================

export function RecentActivityWidget({ data }: { data: RecentActivity[] }) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-blue-600" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            Recent Activity
          </h2>
        </div>
        {data.length > 0 && (
          <Link
            href="/admin/audit"
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all <ArrowRight className="size-3" />
          </Link>
        )}
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No activity yet.
        </p>
      ) : (
        <div className="space-y-1">
          {data.map((a, i) => (
            <div
              key={`act-${a.id}-${i}`}
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 shrink-0 mt-0.5">
                <Clock className="size-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  <span className="font-semibold font-mono text-xs">
                    {a.admin_username ?? "system"}
                  </span>{" "}
                  <span className="text-gray-600 dark:text-gray-400">
                    {actionLabels[a.action] ?? a.action}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(a.created_at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}