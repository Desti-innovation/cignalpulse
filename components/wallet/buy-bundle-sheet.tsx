"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Clock, Infinity as InfinityIcon, Loader2, Wallet, X } from "lucide-react"
import type { WalletBundle } from "@/app/actions/wallet"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  bundle: WalletBundle | null
  walletBalance: number
  onConfirm: () => void
  isProcessing: boolean
  error?: string | null
}

export function BuyBundleSheet({
  open,
  onOpenChange,
  bundle,
  walletBalance,
  onConfirm,
  isProcessing,
  error,
}: Props) {
  if (!open || !bundle) return null

  const totalCredits = bundle.credits + bundle.bonus_credits
  const hasEnough = walletBalance >= bundle.price_ghs
  const isExpiry = bundle.bundle_type === "expiry"

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
            Confirm Purchase
          </h2>
          <button
            onClick={() => !isProcessing && onOpenChange(false)}
            disabled={isProcessing}
            className="flex size-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Bundle summary */}
          <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {bundle.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isExpiry
                    ? `Valid for ${bundle.validity_days} days`
                    : "Never expires"}
                </p>
              </div>
              {isExpiry ? (
                <Clock className="size-5 text-amber-500" />
              ) : (
                <InfinityIcon className="size-5 text-blue-500" />
              )}
            </div>

            <div className="space-y-3">
              <Row
                label="Credits"
                value={`${bundle.credits.toLocaleString()} SMS`}
              />
              {bundle.bonus_credits > 0 && (
                <Row
                  label="Bonus credits"
                  value={`+${bundle.bonus_credits.toLocaleString()} SMS`}
                  muted
                />
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <Row
                  label="Total credits"
                  value={`${totalCredits.toLocaleString()} SMS`}
                  bold
                />
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <Row
                  label="Price"
                  value={`GH₵ ${bundle.price_ghs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`}
                  bold
                />
              </div>
            </div>
          </div>

          {/* Wallet balance */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                Wallet balance
              </span>
            </div>
            <span className="text-sm font-bold text-blue-900 dark:text-blue-100">
              GH₵ {walletBalance.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Insufficient balance warning */}
          {!hasEnough && !error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
              <div className="text-xs text-red-800 dark:text-red-200">
                <p className="font-semibold mb-1">Insufficient wallet balance</p>
                <p>
                  You need GH₵{" "}
                  {(bundle.price_ghs - walletBalance).toFixed(2)} more. Top up
                  your wallet first.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
              <div className="text-xs text-red-800 dark:text-red-200">
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pb-4 space-y-2">
            <Button
              onClick={onConfirm}
              disabled={isProcessing || !hasEnough}
              className="w-full h-14 text-base font-semibold bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Confirm Purchase — GH₵ {bundle.price_ghs.toFixed(2)}</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  muted,
  bold,
}: {
  label: string
  value: string
  muted?: boolean
  bold?: boolean
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
          bold
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