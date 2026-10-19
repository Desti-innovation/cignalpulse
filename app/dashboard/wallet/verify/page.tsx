"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { SmsSpinner } from "@/components/sms-spinner"
import { Zap, CheckCircle2, XCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { verifyPaystackPayment } from "@/app/actions/wallet"

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const reference = searchParams.get("reference") || searchParams.get("trxref")

  const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = React.useState("")
  const [amount, setAmount] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!reference) {
      setStatus("error")
      setErrorMessage("No payment reference found.")
      return
    }

    let isMounted = true

    async function verify() {
      try {
        const result = await verifyPaystackPayment(reference!)
        
        if (!isMounted) return

        if (result.success) {
          setStatus("success")
          setAmount(result.amountCredited ?? null)
          
          setTimeout(() => {
            router.push(`/dashboard/wallet?topup=success&amount=${result.amountCredited}`)
            router.refresh()
          }, 2000)
        } else {
          setStatus("error")
          setErrorMessage(result.error || "Verification failed. Please contact support.")
        }
      } catch (err) {
        if (!isMounted) return
        setStatus("error")
        setErrorMessage("An unexpected error occurred while verifying the payment.")
      }
    }

    verify()

    return () => {
      isMounted = false
    }
  }, [reference, router])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-white dark:bg-gray-950 gap-8 px-6">
      <div className="flex items-center gap-2 font-bold text-2xl text-blue-700 dark:text-blue-400">
        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
          <Zap className="size-6 fill-current" />
        </div>
        CignalPulse
      </div>

      {status === "loading" && (
        <div className="flex flex-col items-center gap-6 animate-in fade-in">
          <SmsSpinner />
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Verifying your payment...
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Please do not close this page. We are confirming your transaction with Paystack.
            </p>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-6 animate-in zoom-in-95">
          <div className="flex size-20 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/40">
            <CheckCircle2 className="size-10 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Payment Successful
            </h2>
            {amount && (
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                GH₵ {amount.toFixed(2)} added to your wallet
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Redirecting to your wallet...
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-6 animate-in zoom-in-95">
          <div className="flex size-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
            <XCircle className="size-10 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Verification Failed
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              {errorMessage}
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/wallet")}
            variant="outline"
            className="mt-4 gap-2"
          >
            Return to Wallet <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-white dark:bg-gray-950">
          <SmsSpinner />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}