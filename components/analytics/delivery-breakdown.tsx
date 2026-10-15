"use client"

import { CheckCircle2, Clock, XCircle, AlertCircle, Hourglass } from "lucide-react"

interface Props {
  breakdown: {
    delivered: number
    submitted: number
    failed: number
    rejected: number
    pending: number
  }
}

export function DeliveryBreakdown({ breakdown }: Props) {
  const total =
    breakdown.delivered +
    breakdown.submitted +
    breakdown.failed +
    breakdown.rejected +
    breakdown.pending

  if (total === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          No delivery data yet.
        </p>
      </div>
    )
  }

  const items = [
    {
      label: "Delivered",
      count: breakdown.delivered,
      color: "bg-green-500",
      textColor: "text-green-600 dark:text-green-400",
      icon: CheckCircle2,
    },
    {
      label: "Submitted",
      count: breakdown.submitted,
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
      icon: Clock,
    },
    {
      label: "Pending",
      count: breakdown.pending,
      color: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
      icon: Hourglass,
    },
    {
      label: "Failed",
      count: breakdown.failed,
      color: "bg-red-500",
      textColor: "text-red-600 dark:text-red-400",
      icon: XCircle,
    },
    {
      label: "Rejected",
      count: breakdown.rejected,
      color: "bg-rose-500",
      textColor: "text-rose-600 dark:text-rose-400",
      icon: AlertCircle,
    },
  ]

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const pct = total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0
        const Icon = item.icon
        return (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Icon className={`size-3.5 ${item.textColor}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {item.count.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {pct}%
                </span>
              </div>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}