"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Loader2 } from "lucide-react"

interface Props {
  onSelectPreset: (amount: number) => void
  onSelectCustom: (amount: number) => void
  isProcessing: boolean
}

const PRESETS = [50, 100, 200, 500]

export function TopUpPanel({ onSelectPreset, onSelectCustom, isProcessing }: Props) {
  const [customAmount, setCustomAmount] = React.useState("")

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(customAmount)
    if (!isNaN(amount) && amount >= 1) {
      onSelectCustom(amount)
    }
  }

  return (
    <div className="space-y-6">
      {/* Preset amounts */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Quick Top-Up
        </p>
        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map((amount) => (
            <button
              key={amount}
              onClick={() => onSelectPreset(amount)}
              disabled={isProcessing}
              className="group relative rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 text-left transition-all hover:border-blue-500 hover:shadow-md active:scale-[0.98] disabled:opacity-50 min-h-[80px]"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Top Up
                </span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  GH₵ {amount}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom amount */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Or Enter Custom Amount
        </p>
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              GH₵
            </span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min={1}
              max={10000}
              step="0.01"
              className="pl-14 h-14 text-lg border-2"
              disabled={isProcessing}
            />
          </div>
          <Button
            type="submit"
            disabled={isProcessing || !customAmount || parseFloat(customAmount) < 1}
            className="h-14 px-6 bg-blue-600 hover:bg-blue-700 min-w-[100px]"
          >
            {isProcessing ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                Next
                <ArrowRight className="size-4 ml-1" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}