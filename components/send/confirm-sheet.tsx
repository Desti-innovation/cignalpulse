"use client"

import { Button } from "@/components/ui/button"
import {
  Send,
  Loader2,
  X,
  Users,
  Coins,
  Calendar,
  MessageSquare,
} from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  senderId: string
  message: string
  recipientCount: number
  smsParts: number
  totalCredits: number
  isScheduled: boolean
  scheduledAt?: string | null
  isProcessing: boolean
  onConfirm: () => void
}

export function ConfirmSheet({
  open,
  onOpenChange,
  senderId,
  message,
  recipientCount,
  smsParts,
  totalCredits,
  isScheduled,
  scheduledAt,
  isProcessing,
  onConfirm,
}: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => !isProcessing && onOpenChange(false)}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-900 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {isScheduled ? "Confirm Schedule" : "Confirm Send"}
          </h2>
          <button
            onClick={() => !isProcessing && onOpenChange(false)}
            disabled={isProcessing}
            className="flex size-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          {/* Message preview */}
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Message
              </span>
            </div>
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
              {message}
            </p>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-muted-foreground">
              <span>From: <strong className="font-mono text-gray-900 dark:text-gray-100">{senderId}</strong></span>
              <span>·</span>
              <span>{smsParts} SMS each</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Users className="size-3" />
                Recipients
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {recipientCount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Coins className="size-3" />
                Credits
              </div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {totalCredits.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Scheduled info */}
          {isScheduled && scheduledAt && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900">
              <Calendar className="size-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs text-purple-800 dark:text-purple-200">
                <p className="font-semibold mb-0.5">
                  Scheduled for later
                </p>
                <p>
                  {new Date(scheduledAt).toLocaleString("en-GB", {
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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 font-semibold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="size-4 mr-2" />
                  {isScheduled ? "Schedule" : "Send Now"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}