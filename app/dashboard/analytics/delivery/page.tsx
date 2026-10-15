import { redirect } from "next/navigation"
import Link from "next/link"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import DashboardPage from "@/components/dashboard-content"
import { DeliveryRateChart } from "@/components/analytics/delivery-rate-chart"
import { DeliveryBreakdown } from "@/components/analytics/delivery-breakdown"
import {
  getAnalyticsOverview,
  getDeliveryBreakdown,
  getDeliveryRateTrend,
  getFailedMessages,
} from "@/app/actions/user-analytics"
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DeliveryRatesPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const [userRows, overview, breakdown, trend, failures] = await Promise.all([
    sql`
      SELECT username, email, company_name, display_name, logo_url, role, sending_status
      FROM users
      WHERE id = ${session.userId}
      LIMIT 1
    `,
    getAnalyticsOverview(),
    getDeliveryBreakdown(),
    getDeliveryRateTrend(30),
    getFailedMessages(20),
  ])

  if (userRows.length === 0) redirect("/login")

  const user = userRows[0]

  const [wallet] = await sql`
    SELECT sms_credits FROM user_wallets WHERE user_id = ${session.userId} LIMIT 1
  `

  // Compute best/worst days
  const daysWithData = trend.filter((d) => d.sent > 0)
  const bestDay = daysWithData.reduce(
    (best, d) => (d.rate > (best?.rate ?? 0) ? d : best),
    daysWithData[0]
  )
  const worstDay = daysWithData.reduce(
    (worst, d) => (d.rate < (worst?.rate ?? 100) ? d : worst),
    daysWithData[0]
  )

  return (
    <DashboardPage
      user={{
        username: user.username,
        email: user.email,
        companyName: user.display_name || user.company_name,
        logoUrl: user.logo_url,
        role: user.role as "user" | "admin",
        sendingStatus: (user.sending_status ?? "active") as
          | "active"
          | "flagged"
          | "suspended",
        wallet: {
          balanceGhs: 0,
          smsCredits: wallet?.sms_credits ?? 0,
          lifetimeTopupGhs: 0,
        },
        stats: {
          totalSent: overview.totalSent,
          deliveryRate: overview.deliveryRate,
          activeCampaigns: 0,
          newContacts: 0,
        },
      }}
      breadcrumb="Delivery Rates"
    >
      <div className="flex flex-1 flex-col gap-4 md:gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
        {/* Back */}
        <Link
          href="/dashboard/analytics"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 w-fit"
        >
          <ArrowLeft className="size-4" />
          Back to Analytics
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Delivery Rates
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Detailed breakdown of how your messages are performing.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">
                Overall Rate
              </p>
              <div className="flex size-7 md:size-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/40">
                <TrendingUp className="size-3.5 md:size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
              {overview.deliveryRate}%
            </p>
          </div>

          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">
                Delivered
              </p>
              <div className="flex size-7 md:size-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/40">
                <CheckCircle2 className="size-3.5 md:size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {overview.totalDelivered.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">
                Best Day
              </p>
              <div className="flex size-7 md:size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
                <TrendingUp className="size-3.5 md:size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {bestDay?.rate ?? 0}%
            </p>
            {bestDay && (
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {new Date(bestDay.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            )}
          </div>

          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">
                Worst Day
              </p>
              <div className="flex size-7 md:size-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40">
                <XCircle className="size-3.5 md:size-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400">
              {worstDay?.rate ?? 0}%
            </p>
            {worstDay && (
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {new Date(worstDay.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Trend chart */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="size-4 text-green-600" />
              Delivery Rate Over Time
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily success rate for the last 30 days.
            </p>
          </div>
          <DeliveryRateChart data={trend} />
        </div>

        {/* Two columns: breakdown + failures */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {/* Status breakdown */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Status Breakdown
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              Distribution of your messages by status.
            </p>
            <DeliveryBreakdown breakdown={breakdown} />
          </div>

          {/* Failed messages */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                Recent Failures
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Last 20 messages that failed or were rejected.
              </p>
            </div>

            {failures.length === 0 ? (
              <div className="p-10 text-center">
                <CheckCircle2 className="size-10 text-green-300 dark:text-green-700 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No failures — everything's going through!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[400px] overflow-y-auto">
                {failures.map((f) => (
                  <div
                    key={`fail-${f.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <div className="flex size-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/40 shrink-0">
                      <AlertCircle className="size-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-gray-900 dark:text-gray-100 truncate">
                        +{f.recipient}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        <span
                          className={
                            f.status === "REJECTED"
                              ? "text-rose-600 dark:text-rose-400 font-semibold"
                              : "text-red-600 dark:text-red-400 font-semibold"
                          }
                        >
                          {f.status}
                        </span>
                        {" · "}
                        {new Date(f.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      title="Retry sending"
                      className="shrink-0 flex size-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <RotateCcw className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardPage>
  )
}