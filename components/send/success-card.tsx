"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  ArrowRight,
  Calendar,
  Clock,
  X,
} from "lucide-react"

interface SuccessData {
  campaignDbId: number
  campaignId: string
  recipientCount: number
  totalSent: number
  totalRejected: number
  creditsUsed: number
  isScheduled: boolean
  senderId: string
  message: string
  scheduledAt: string | null
}

interface Props {
  data: SuccessData
  onViewNow: () => void
  onDismiss: () => void
}

export function SuccessCard({ data, onViewNow, onDismiss }: Props) {
  const [countdown, setCountdown] = React.useState(5)

  // Auto-redirect countdown
  React.useEffect(() => {
    if (countdown <= 0) {
      onViewNow()
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, onViewNow])

  const successRate =
    data.recipientCount > 0
      ? Math.round((data.totalSent / data.recipientCount) * 100)
      : 0

  return (
    <div className="rounded-2xl border-2 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 overflow-hidden relative">
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors z-10"
      >
        <X className="size-4 text-green-700 dark:text-green-300" />
      </button>

      <div className="p-5 md:p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="flex size-12 items-center justify-center rounded-full bg-green-500 shrink-0">
            <CheckCircle2 className="size-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-green-900 dark:text-green-100">
              {data.isScheduled ? "SMS Scheduled" : "Campaign Sent"}
            </h2>
            <p className="text-xs text-green-700 dark:text-green-300 mt-0.5 font-mono truncate">
              {data.campaignId}
            </p>
          </div>
        </div>

        {/* Scheduled info */}
        {data.isScheduled && data.scheduledAt && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-900/50 border border-green-200 dark:border-green-900 mb-4">
            <Calendar className="size-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <div className="text-xs text-green-800 dark:text-green-200">
              <p className="font-semibold">Will send at</p>
              <p className="mt-0.5">
                {new Date(data.scheduledAt).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        )}

        {/* Stats grid */}
        {!data.isScheduled && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-white dark:bg-gray-900/50 p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                Recipients
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {data.recipientCount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-white dark:bg-gray-900/50 p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                Accepted
              </p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {data.totalSent.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-white dark:bg-gray-900/50 p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                Rejected
              </p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {data.totalRejected.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {!data.isScheduled && (
          <p className="text-xs text-green-700 dark:text-green-300 mb-4 text-center">
            <strong>{successRate}%</strong> accepted by the gateway
          </p>
        )}

        {/* Credits used */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900/50 border border-green-200 dark:border-green-900 mb-4">
          <span className="text-xs text-muted-foreground">Credits used</span>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {data.creditsUsed.toLocaleString()}
          </span>
        </div>

        {/* Auto-redirect countdown */}
        <div className="flex items-center gap-2 mb-3">
          <Clock className="size-3.5 text-green-600 dark:text-green-400" />
          <p className="text-xs text-green-700 dark:text-green-300">
            Redirecting to campaign details in{" "}
            <strong>{countdown}s</strong>...
          </p>
        </div>

        {/* Manual button */}
        <Button
          onClick={onViewNow}
          className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          View Campaign
          <ArrowRight className="size-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}