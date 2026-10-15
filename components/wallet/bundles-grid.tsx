"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Clock, Infinity as InfinityIcon, ShoppingCart } from "lucide-react"
import type { WalletBundle } from "@/app/actions/wallet"

interface Props {
  bundles: WalletBundle[]
  onBuy: (bundle: WalletBundle) => void
}

export function BundlesGrid({ bundles, onBuy }: Props) {
  const [filter, setFilter] = React.useState<"all" | "non_expiry" | "expiry">(
    "all"
  )

  const filtered = bundles.filter((b) => {
    if (filter === "all") return true
    return b.bundle_type === filter
  })

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-6 px-6 md:mx-0 md:px-0">
        {(["all", "non_expiry", "expiry"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${
                filter === f
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }
            `}
          >
            {f === "all"
              ? "All Bundles"
              : f === "non_expiry"
              ? "Never Expires"
              : "30-Day Deals"}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {filtered.map((b) => (
          <BundleCard key={b.id} bundle={b} onBuy={() => onBuy(b)} />
        ))}
      </div>
    </div>
  )
}

function BundleCard({
  bundle,
  onBuy,
}: {
  bundle: WalletBundle
  onBuy: () => void
}) {
  const perSms = bundle.credits > 0 ? bundle.price_ghs / bundle.credits : 0
  const isExpiry = bundle.bundle_type === "expiry"

  return (
    <div
      className={`
        rounded-2xl border-2 p-5 flex flex-col gap-4 transition-all
        ${
          isExpiry
            ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {bundle.name}
        </h3>
        {isExpiry ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
            <Clock className="size-3" />
            {bundle.validity_days}D
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            <InfinityIcon className="size-3" />
            Forever
          </span>
        )}
      </div>

      {/* Price */}
      <div>
        <p
          className={`text-3xl font-bold ${
            isExpiry
              ? "text-amber-600 dark:text-amber-400"
              : "text-blue-600 dark:text-blue-400"
          }`}
        >
          GH₵ {bundle.price_ghs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          <span className="font-semibold">{bundle.credits.toLocaleString()}</span>{" "}
          SMS
          {bundle.bonus_credits > 0 && (
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-medium">
              +{bundle.bonus_credits.toLocaleString()} bonus
            </span>
          )}
        </p>
        <p
          className={`text-xs font-mono mt-1 ${
            isExpiry
              ? "text-amber-700/70 dark:text-amber-400/70"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          GH₵ {perSms.toFixed(3)} per SMS
        </p>
      </div>

      {/* Description */}
      {bundle.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {bundle.description}
        </p>
      )}

      {/* Buy button */}
      <Button
        onClick={onBuy}
        className={`
          w-full h-11 font-semibold gap-2 mt-auto
          ${
            isExpiry
              ? "bg-amber-600 hover:bg-amber-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }
        `}
      >
        <ShoppingCart className="size-4" />
        Buy Now
      </Button>
    </div>
  )
}