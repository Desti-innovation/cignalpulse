"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldCheck, X } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  amountGhs: number
  onConfirm: () => void
  isProcessing: boolean
}

const PAYSTACK_FEE_RATE = 0.0195
const PLATFORM_FEE_GHS = 0.50

export function TopUpSheet({
  open,
  onOpenChange,
  amountGhs,
  onConfirm,
  isProcessing,
}: Props) {
  const paystackFee = Math.round(amountGhs * PAYSTACK_FEE_RATE * 100) / 100
  const totalPaid = amountGhs + paystackFee + PLATFORM_FEE_GHS

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
            Confirm Top-Up
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
          {/* Summary */}
          <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-5 space-y-3">
            <Row label="Amount" value={`GH₵ ${amountGhs.toFixed(2)}`} />
            <Row label="Paystack fee" value={`GH₵ ${paystackFee.toFixed(2)}`} muted />
            <Row label="Platform fee" value={`GH₵ ${PLATFORM_FEE_GHS.toFixed(2)}`} muted />
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <Row
                label="Total to pay"
                value={`GH₵ ${totalPaid.toFixed(2)}`}
                bold
              />
            </div>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
            <ShieldCheck className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
              <p className="font-semibold mb-1">
                GH₵ {amountGhs.toFixed(2)} will be added to your wallet
              </p>
              <p>
                You'll be redirected to Paystack to complete payment securely. We
                accept card, mobile money, and bank transfer.
              </p>
            </div>
          </div>

          {/* Action */}
          <div className="pb-4">
            <Button
              onClick={onConfirm}
              disabled={isProcessing}
              className="w-full h-14 text-base font-semibold bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-5 mr-2 animate-spin" />
                  Redirecting to Paystack...
                </>
              ) : (
                <>Pay GH₵ {totalPaid.toFixed(2)}</>
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
          muted
            ? "text-muted-foreground"
            : "text-gray-700 dark:text-gray-300"
        }`}
      >
        {label}
      </span>
      <span
        className={`${
          bold
            ? "text-lg font-bold text-gray-900 dark:text-gray-100"
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