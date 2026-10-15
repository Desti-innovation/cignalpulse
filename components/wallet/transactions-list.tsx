"use client"

import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
} from "lucide-react"
import type { WalletTransaction } from "@/app/actions/wallet"

interface Props {
  transactions: WalletTransaction[]
}

export function TransactionsList({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
        <Receipt className="size-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No transactions yet. Your activity will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
      {transactions.map((tx, i) => (
        <TransactionRow key={`tx-${tx.id}-${i}`} tx={tx} />
      ))}
    </div>
  )
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const isTopup = tx.type === "wallet_topup"
  const date = new Date(tx.initiated_at)
  const relative = getRelativeTime(date)

  const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    success: {
      icon: <CheckCircle2 className="size-3" />,
      color: "text-green-600 dark:text-green-400",
    },
    pending: {
      icon: <Clock className="size-3" />,
      color: "text-amber-600 dark:text-amber-400",
    },
    failed: {
      icon: <XCircle className="size-3" />,
      color: "text-red-600 dark:text-red-400",
    },
  }
  const status = statusConfig[tx.status] ?? statusConfig.success

  return (
    <div className="flex items-center gap-4 p-4">
      <div
        className={`
          flex size-10 items-center justify-center rounded-full shrink-0
          ${
            isTopup
              ? "bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400"
              : "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"
          }
        `}
      >
        {isTopup ? (
          <ArrowDownLeft className="size-5" />
        ) : (
          <ArrowUpRight className="size-5" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {isTopup
              ? "Wallet Top-Up"
              : `Bought ${tx.bundle_name ?? "Bundle"}`}
          </p>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold ${status.color}`}
          >
            {status.icon}
            {tx.status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {relative}
          {!isTopup && tx.credits > 0 && (
            <>
              {" • "}
              {tx.credits.toLocaleString()}
              {tx.bonus_credits > 0 ? ` + ${tx.bonus_credits.toLocaleString()} bonus` : ""}{" "}
              credits
            </>
          )}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p
          className={`text-sm font-bold ${
            isTopup
              ? "text-green-600 dark:text-green-400"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {isTopup ? "+" : "-"}GH₵{" "}
          {tx.amount_ghs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  )
}

function getRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}