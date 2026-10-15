"use client"

import { Button } from "@/components/ui/button"
import { Wallet, MessageSquare, Plus, TrendingUp } from "lucide-react"

interface Props {
  balanceGhs: number
  smsCredits: number
  lifetimeTopupGhs: number
  onTopUp: () => void
  onBuyCredits: () => void
}

export function WalletHeader({
  balanceGhs,
  smsCredits,
  lifetimeTopupGhs,
  onTopUp,
  onBuyCredits,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Wallet Balance Card */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="size-5 text-blue-200" />
              <p className="text-blue-100 text-sm font-medium">Wallet Balance</p>
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">
                GH₵ {balanceGhs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-blue-200 text-xs">
              <TrendingUp className="size-3.5" />
              Lifetime: GH₵ {lifetimeTopupGhs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <Button
            onClick={onTopUp}
            size="lg"
            className="bg-white text-blue-700 hover:bg-blue-50 font-semibold w-full h-12 mt-2"
          >
            <Plus className="size-5 mr-2" />
            Top Up Wallet
          </Button>
        </div>
        <Wallet className="absolute -bottom-6 -right-6 size-40 text-blue-500 opacity-20" />
      </div>

      {/* SMS Credits Card */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-purple-200" />
            <p className="text-purple-100 text-sm font-medium">SMS Credits</p>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">
                {smsCredits.toLocaleString()}
              </span>
              <span className="text-purple-200 text-sm">credits</span>
            </div>
            <p className="text-purple-200 text-xs mt-2">
              {smsCredits > 0
                ? "Ready to send"
                : "Buy a bundle below to start sending"}
            </p>
          </div>

          <Button
            onClick={onBuyCredits}
            size="lg"
            className="bg-white text-purple-700 hover:bg-purple-50 font-semibold w-full h-12 mt-2"
          >
            <Plus className="size-5 mr-2" />
            Buy Credits
          </Button>
        </div>
        <MessageSquare className="absolute -bottom-6 -right-6 size-40 text-purple-500 opacity-20" />
      </div>
    </div>
  )
}