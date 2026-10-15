"use client"

import { Coins, AlertTriangle } from "lucide-react"

interface Props {
  recipientCount: number
  smsParts: number
  creditsPerRecipient: number
  currentBalance: number
  isScheduled?: boolean
}

export function CostSummary({
  recipientCount,
  smsParts,
  creditsPerRecipient,
  currentBalance,
  isScheduled,
}: Props) {
  const totalCredits = recipientCount * creditsPerRecipient
  const remaining = currentBalance - totalCredits
  const hasEnough = remaining >= 0
  const nothingToShow = recipientCount === 0

  // ============================================================
  // MOBILE — one-line compact summary (hidden entirely when empty)
  // ============================================================
  const mobileView = (
    <div className="md:hidden">
      {!nothingToShow && (
        hasEnough ? (
          <p className="text-[11px] text-muted-foreground text-center">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {recipientCount.toLocaleString()}
            </span>{" "}
            recipient{recipientCount === 1 ? "" : "s"}
            {" · "}
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {totalCredits.toLocaleString()}
            </span>{" "}
            credits
            {" · "}
            balance {currentBalance.toLocaleString()} →{" "}
            <span className="font-semibold text-green-600 dark:text-green-400">
              {remaining.toLocaleString()}
            </span>
          </p>
        ) : (
          <p className="text-[11px] text-red-600 dark:text-red-400 text-center flex items-center justify-center gap-1.5">
            <AlertTriangle className="size-3" />
            Need {Math.abs(remaining).toLocaleString()} more credits
          </p>
        )
      )}
    </div>
  )

  // ============================================================
  // DESKTOP — full card
  // ============================================================
  const desktopView = (
    <div className="hidden md:block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40">
          <Coins className="size-4 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Cost Summary
        </h3>
      </div>

      <div className="space-y-2.5">
        <Row label="Recipients" value={recipientCount.toLocaleString()} />
        <Row label="SMS per recipient" value={String(smsParts)} />
        <div className="border-t border-gray-100 dark:border-gray-800 pt-2.5 mt-2.5">
          <Row
            label="Credits needed"
            value={totalCredits.toLocaleString()}
            bold
          />
        </div>
        <Row
          label="Your balance"
          value={currentBalance.toLocaleString()}
          muted
        />
        <div className="border-t border-gray-100 dark:border-gray-800 pt-2.5 mt-2.5">
          {hasEnough ? (
            <Row
              label="After send"
              value={remaining.toLocaleString()}
              highlight
            />
          ) : (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
              <AlertTriangle className="size-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800 dark:text-red-200">
                <p className="font-semibold mb-0.5">
                  Not enough credits
                </p>
                <p>
                  You need{" "}
                  <strong>{Math.abs(remaining).toLocaleString()}</strong> more
                  credits. Top up your wallet first.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {isScheduled && hasEnough && (
        <p className="text-[11px] text-muted-foreground mt-3 italic">
          Credits will be deducted when the SMS is sent at the scheduled time.
        </p>
      )}
    </div>
  )

  return (
    <>
      {mobileView}
      {desktopView}
    </>
  )
}

function Row({
  label,
  value,
  bold,
  muted,
  highlight,
}: {
  label: string
  value: string
  bold?: boolean
  muted?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`text-sm ${
          muted ? "text-muted-foreground" : "text-gray-700 dark:text-gray-300"
        }`}
      >
        {label}
      </span>
      <span
        className={`${
          highlight
            ? "text-base font-bold text-green-600 dark:text-green-400"
            : bold
            ? "text-base font-bold text-gray-900 dark:text-gray-100"
            : muted
            ? "text-sm text-muted-foreground"
            : "text-sm font-medium text-gray-900 dark:text-gray-100"
        }`}
      >
        {value}
      </span>
    </div>
  )
}