import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { detectUserPatterns } from "@/app/actions/detect-patterns"
import { startCronRun, finishCronRun } from "@/app/actions/admin-crons"

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret")
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const startTime = Date.now()
  await startCronRun("detect-patterns")

  try {
    const users = await sql`
      SELECT DISTINCT user_id
      FROM sms_campaigns
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `

    const results = []
    for (const u of users) {
      const result = await detectUserPatterns(u.user_id)
      results.push({ userId: u.user_id, ...result })
    }

    const duration = Date.now() - startTime
    await finishCronRun("detect-patterns", "success", duration)

    return NextResponse.json({
      checked: users.length,
      flagged: results.filter((r) => r.flagged).length,
      results,
    })
    } catch (error) {
    const duration = Date.now() - startTime
    console.error("[cron/detect-patterns] FAILED:", error)
    await finishCronRun(
      "detect-patterns",
      "failed",
      duration,
      error instanceof Error ? error.message : "Unknown error"
    )
    return NextResponse.json(
      { error: "Cron failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    )
  }
}