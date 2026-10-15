"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { WalletHeader } from "@/components/wallet/wallet-header"
import { TopUpPanel } from "@/components/wallet/topup-panel"
import { TopUpSheet } from "@/components/wallet/topup-sheet"
import { BundlesGrid } from "@/components/wallet/bundles-grid"
import { BuyBundleSheet } from "@/components/wallet/buy-bundle-sheet"
import { TransactionsList } from "@/components/wallet/transactions-list"
import {
  getWalletData,
  initializeTopupAction,
  purchaseBundleAction,
  type WalletBundle,
  type WalletData,
} from "@/app/actions/wallet"
import { Wallet, Package, History, AlertTriangle, Clock } from "lucide-react"

interface Props {
  initialData: WalletData
}

export function WalletPageClient({ initialData }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = React.useState<WalletData>(initialData)
  const [topupAmount, setTopupAmount] = React.useState<number | null>(null)
  const [buyBundle, setBuyBundle] = React.useState<WalletBundle | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [purchaseError, setPurchaseError] = React.useState<string | null>(null)

  // Scroll refs for smooth navigation
  const bundlesRef = React.useRef<HTMLDivElement>(null)

  // Refresh data from server
  const refresh = React.useCallback(async () => {
    const fresh = await getWalletData()
    if (fresh) setData(fresh)
    router.refresh()
  }, [router])

  // Handle top-up status from URL query params (e.g. after Paystack redirect)
  React.useEffect(() => {
    const topupStatus = searchParams.get("topup")
    const amount = searchParams.get("amount")

    if (topupStatus === "success" && amount) {
      alert(`Top-up successful! GH₵${amount} added to your wallet.`)
    } else if (topupStatus === "failed") {
      alert("Payment was not successful. Please try again.")
    }

    // Clean URL
    if (topupStatus) {
      window.history.replaceState({}, "", "/dashboard/wallet")
      // Refresh wallet data so the new balance is reflected
      refresh()
    }
  }, [searchParams, refresh])

  // -------- Top-up flow --------
  const handleInitiateTopup = async (amount: number) => {
    setIsProcessing(true)
    const result = await initializeTopupAction(amount)
    setIsProcessing(false)

    if (!result.success || !result.authorizationUrl) {
      alert(result.error || "Failed to start payment.")
      return
    }

    // Redirect to Paystack
    window.location.href = result.authorizationUrl
  }

  // -------- Buy bundle flow --------
  const handleConfirmPurchase = async () => {
    if (!buyBundle) return
    setIsProcessing(true)
    setPurchaseError(null)

    const result = await purchaseBundleAction(buyBundle.id)
    setIsProcessing(false)

    if (!result.success) {
      setPurchaseError(result.error || "Purchase failed.")
      return
    }

    setBuyBundle(null)
    await refresh()

    // Success feedback
    alert(
      `Purchase successful! ${result.creditsAdded?.toLocaleString()} credits added.`
    )
  }

  const scrollToBundles = () => {
    bundlesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Wallet
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Top up your wallet and buy SMS credits.
        </p>
      </div>

      {/* Expiry warning */}
      {data.expiringSoon && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
          <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              {data.expiringSoon.creditsRemaining.toLocaleString()} credits
              expiring soon
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              These credits expire on{" "}
              {new Date(data.expiringSoon.expiresAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
              })}
              . Use them or lose them.
            </p>
          </div>
        </div>
      )}

      {/* Header cards */}
      <WalletHeader
        balanceGhs={data.balanceGhs}
        smsCredits={data.smsCredits}
        lifetimeTopupGhs={data.lifetimeTopupGhs}
        onTopUp={() => handleInitiateTopup(0)}
        onBuyCredits={scrollToBundles}
      />

      {/* Top-up section */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 md:p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
            <Wallet className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            Top Up Your Wallet
          </h2>
        </div>
        <TopUpPanel
          onSelectPreset={(amount) => setTopupAmount(amount)}
          onSelectCustom={(amount) => setTopupAmount(amount)}
          isProcessing={isProcessing}
        />
      </div>

      {/* Bundles section */}
      <div
        ref={bundlesRef}
        className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 md:p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/40">
            <Package className="size-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Buy SMS Bundles
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Purchases are instant — deducted from your wallet balance.
            </p>
          </div>
        </div>
        <BundlesGrid bundles={data.bundles} onBuy={setBuyBundle} />
      </div>

      {/* Transactions section */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 md:p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
            <History className="size-4 text-gray-600 dark:text-gray-400" />
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            Recent Activity
          </h2>
        </div>
        <TransactionsList transactions={data.transactions} />
      </div>

      {/* Top-up sheet */}
      <TopUpSheet
        open={topupAmount !== null && topupAmount > 0}
        onOpenChange={(open) => {
          if (!open && !isProcessing) setTopupAmount(null)
        }}
        amountGhs={topupAmount ?? 0}
        onConfirm={() => {
          if (topupAmount) handleInitiateTopup(topupAmount)
        }}
        isProcessing={isProcessing}
      />

      {/* Buy bundle sheet */}
      <BuyBundleSheet
        open={!!buyBundle}
        onOpenChange={(open) => {
          if (!open && !isProcessing) {
            setBuyBundle(null)
            setPurchaseError(null)
          }
        }}
        bundle={buyBundle}
        walletBalance={data.balanceGhs}
        onConfirm={handleConfirmPurchase}
        isProcessing={isProcessing}
        error={purchaseError}
      />
    </div>
  )
}