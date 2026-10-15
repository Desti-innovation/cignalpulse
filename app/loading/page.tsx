"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { SmsSpinner } from "@/components/sms-spinner"
import { Zap } from "lucide-react"

function LoadingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestId = searchParams.get("requestId") || ""

  // If we have a requestId, redirect to the status page after 2.5s
  // If not, it's just a generic loading page (no redirect)
  React.useEffect(() => {
    if (!requestId) return

    const timer = setTimeout(() => {
      router.push(`/sender-id-status?requestId=${requestId}`)
    }, 2500)

    return () => clearTimeout(timer)
  }, [router, requestId])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-white dark:bg-gray-950 gap-12 px-6">
      {/* Brand Logo */}
      <div className="flex items-center gap-2 font-bold text-2xl text-blue-700 dark:text-blue-400">
        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
          <Zap className="size-6 fill-current" />
        </div>
        SignalPulse
      </div>

      {/* The Animated Spinner */}
      <SmsSpinner />

      {/* Request ID hint (only shows when redirecting) */}
      {requestId && (
        <p className="text-xs text-muted-foreground">
          Processing request{" "}
          <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
            #{requestId}
          </span>
        </p>
      )}
    </div>
  )
}

export default function LoadingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-white dark:bg-gray-950">
          <SmsSpinner />
        </div>
      }
    >
      <LoadingContent />
    </Suspense>
  )
}