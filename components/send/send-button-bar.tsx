"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Send, Loader2, AlertCircle } from "lucide-react"

interface Props {
  disabled: boolean
  disabledReason?: string
  isProcessing: boolean
  isScheduled: boolean
  totalCredits: number
  recipientCount: number
  onSend: () => void
  /**
   * Secondary action (e.g. Save Draft). Rendered side-by-side with Send
   * on desktop, stacked below on mobile.
   */
  secondaryAction?: React.ReactNode
  /**
   * Only show the disabled reason once the user has actually filled in something.
   */
  showDisabledReason?: boolean
}

export function SendButtonBar({
  disabled,
  disabledReason,
  isProcessing,
  isScheduled,
  totalCredits,
  recipientCount,
  onSend,
  secondaryAction,
  showDisabledReason = false,
}: Props) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
      {/* Disabled reason */}
      {disabled && disabledReason && showDisabledReason && (
        <div className="flex items-center gap-2 mb-3 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{disabledReason}</span>
        </div>
      )}

      <div
        className={`
          grid gap-2 sm:gap-3
          ${secondaryAction ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}
        `}
      >
        {/* Send button */}
        <Button
          onClick={onSend}
          disabled={disabled || isProcessing}
          className="
            h-12 w-full text-sm md:text-base font-semibold
            bg-blue-600 hover:bg-blue-700
            disabled:opacity-50
          "
        >
          {isProcessing ? (
            <>
              <Loader2 className="size-4 md:size-5 mr-2 animate-spin" />
              {isScheduled ? "Scheduling..." : "Sending..."}
            </>
          ) : (
            <>
              <Send className="size-4 md:size-5 mr-2" />
              {isScheduled
                ? `Schedule — ${totalCredits.toLocaleString()} credits`
                : `Send to ${recipientCount.toLocaleString()}`}
            </>
          )}
        </Button>

        {/* Save Draft button */}
        {secondaryAction && <div className="w-full">{secondaryAction}</div>}
      </div>
    </div>
  )
}