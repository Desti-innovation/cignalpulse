import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { paystack } from "@/lib/paystack"
import { verifyPaystackPayment } from "@/app/actions/wallet"
import { startCronRun, finishCronRun } from "@/app/actions/admin-crons"

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret")
  const isDev = process.env.NODE_ENV === "development"

  if (!isDev && (!CRON_SECRET || secret !== CRON_SECRET)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const startTime = Date.now()
  await startCronRun("reconcile-paystack")

  try {
    // Find pending intents from the last 24 hours
    const pendingIntents = await sql`
      SELECT reference
      FROM paystack_intents
      WHERE status = 'pending'
        AND created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at ASC
      LIMIT 100
    `

    const results = {
      checked: pendingIntents.length,
      reconciled: 0,
      failed: 0,
    }

    for (const intent of pendingIntents) {
      const result = await verifyPaystackPayment(intent.reference)
      if (result.success && !result.alreadyProcessed) {
        results.reconciled++
      } else if (!result.success) {
        results.failed++
      }
    }

    const duration = Date.now() - startTime
    await finishCronRun("reconcile-paystack", "success", duration)

    return NextResponse.json({
      success: true,
      ...results,
      duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("[cron/reconcile-paystack] FAILED:", error)
    await finishCronRun(
      "reconcile-paystack",
      "failed",
      duration,
      error instanceof Error ? error.message : "Unknown error"
    )
    return NextResponse.json(
      {
        error: "Cron failed",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    )
  }
}