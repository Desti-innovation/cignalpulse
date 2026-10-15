import { redirect } from "next/navigation"
import Link from "next/link"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import DashboardPage from "@/components/dashboard-content"
import { ActivityChart } from "@/components/analytics/activity-chart"
import {
  getAnalyticsOverview,
  getDailyActivity,
  getTopSenderIds,
  getRecentCampaigns,
} from "@/app/actions/user-analytics"
import {
  Send,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart3,
  Coins,
  ArrowRight,
  Users,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function UserAnalyticsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const [userRows, overview, daily, topSenders, recentCampaigns] =
    await Promise.all([
      sql`
        SELECT username, email, company_name, display_name, logo_url, role, sending_status
        FROM users
        WHERE id = ${session.userId}
        LIMIT 1
      `,
      getAnalyticsOverview(),
      getDailyActivity(30),
      getTopSenderIds(5),
      getRecentCampaigns(5),
    ])

  if (userRows.length === 0) redirect("/login")

  const user = userRows[0]

  const [wallet] = await sql`
    SELECT sms_credits FROM user_wallets WHERE user_id = ${session.userId} LIMIT 1
  `

  const statCards = [
    {
      label: "Total Sent",
      value: overview.totalSent.toLocaleString(),
      subtitle: `${overview.totalCampaigns} campaign${overview.totalCampaigns === 1 ? "" : "s"}`,
      icon: Send,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      label: "Delivered",
      value: overview.totalDelivered.toLocaleString(),
      subtitle: `${overview.deliveryRate}% delivery rate`,
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/40",
    },
    {
      label: "Failed",
      value: (overview.totalFailed + overview.totalRejected).toLocaleString(),
      subtitle: `${overview.failureRate}% failure rate`,
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/40",
    },
    {
      label: "Credits Used",
      value: overview.creditsUsed.toLocaleString(),
      subtitle: `${overview.avgRecipientsPerCampaign} avg per campaign`,
      icon: Coins,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
  ]

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
      breadcrumb="Analytics"
    >
      <div className="flex flex-1 flex-col gap-4 md:gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Analytics
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              How your SMS campaigns are performing.
            </p>
          </div>
          <Link
            href="/dashboard/analytics/delivery"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            Delivery Rates
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <div
                    className={`flex size-7 md:size-8 items-center justify-center rounded-lg ${stat.bg}`}
                  >
                    <Icon className={`size-3.5 md:size-4 ${stat.color}`} />
                  </div>
                </div>
                <p className={`text-xl md:text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
              </div>
            )
          })}
        </div>

        {/* Activity chart */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 className="size-4 text-blue-600" />
              Activity (Last 30 Days)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily volume of messages sent, delivered, and failed.
            </p>
          </div>
          <ActivityChart data={daily} />
        </div>

        {/* Two columns: top senders + recent campaigns */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          {/* Top sender IDs */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
              <TrendingUp className="size-4 text-purple-600" />
              Top Sender IDs
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Which Sender IDs you use most.
            </p>

            {topSenders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No data yet.
              </p>
            ) : (
              <div className="space-y-3">
                {topSenders.map((s, i) => (
                  <div
                    key={`sender-${s.senderId}-${i}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex size-6 items-center justify-center rounded-md bg-blue-600 text-white text-[10px] font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {s.senderId}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.campaigns} campaign
                          {s.campaigns === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                      {s.sent.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent campaigns */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  Recent Campaigns
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your last 5 campaigns.
                </p>
              </div>
              <Link
                href="/dashboard/campaigns"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View all
                <ArrowRight className="size-3" />
              </Link>
            </div>

            {recentCampaigns.length === 0 ? (
              <div className="p-10 text-center">
                <Users className="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No campaigns sent yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentCampaigns.map((c) => (
                  <Link
                    key={`rc-${c.id}`}
                    href={`/dashboard/campaigns/${c.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 shrink-0">
                      <Send className="size-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                        {c.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        <span className="font-mono">{c.senderId}</span>
                        {" · "}
                        {c.recipientCount.toLocaleString()} recipients
                        {" · "}
                        {new Date(c.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        {c.deliveryRate}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        delivered
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-gray-400 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardPage>
  )
}