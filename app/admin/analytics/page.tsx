import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { ActivityChart, TopSendersList } from "@/components/admin/analytics-charts"
import {
  getAnalyticsOverview,
  getDailyActivity,
  getTopSenders,
  getTopSenderIds,
  getStatusBreakdown,
} from "@/app/actions/admin-analytics"
import {
  Send,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart3,
  Coins,
  Users,
  MessageSquare,
  Percent,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminAnalyticsPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name
    FROM admins
    WHERE id = ${session.adminId}
    LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const [overview, daily, topSenders, topSenderIds, statusBreakdown] =
    await Promise.all([
      getAnalyticsOverview(),
      getDailyActivity(30),
      getTopSenders(5),
      getTopSenderIds(5),
      getStatusBreakdown(),
    ])

  const statCards = [
    {
      label: "Messages Sent",
      value: overview.totalSent.toLocaleString(),
      subtitle: `${overview.totalCampaigns} campaign${overview.totalCampaigns === 1 ? "" : "s"}`,
      icon: Send,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Delivered",
      value: overview.totalDelivered.toLocaleString(),
      subtitle: `${overview.deliveryRate}% delivery rate`,
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/30",
    },
    {
      label: "Failed",
      value: overview.totalFailed.toLocaleString(),
      subtitle: `${overview.failureRate}% failure rate`,
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/30",
    },
    {
      label: "Credits Used",
      value: overview.creditsUsed.toLocaleString(),
      subtitle: `${overview.averageRecipientsPerCampaign} avg per campaign`,
      icon: Coins,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
  ]

  return (
    <AdminContent
      admin={{
        fullName: admin.full_name,
        email: admin.email,
        username: admin.username,
      }}
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Analytics" },
      ]}
    >
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platform-wide SMS performance and usage trends.
          </p>
        </div>

        {/* Primary stat cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <div
                    className={`flex size-9 items-center justify-center rounded-lg ${stat.bg}`}
                  >
                    <Icon className={`size-4 ${stat.color}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
              </div>
            )
          })}
        </div>

        {/* Secondary stat cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/30 shrink-0">
              <Users className="size-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Active Customers
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {overview.activeUsers}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/30 shrink-0">
              <MessageSquare className="size-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Active Sender IDs
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {overview.activeSenders}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30 shrink-0">
              <Percent className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Overall Delivery Rate
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {overview.deliveryRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Main chart + Top senders */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <BarChart3 className="size-4 text-blue-600" />
                  SMS Activity (Last 30 Days)
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Daily volume of messages sent, delivered, and failed.
                </p>
              </div>
            </div>
            <ActivityChart data={daily} />
          </div>

          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
              <TrendingUp className="size-4 text-purple-600" />
              Top Senders
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              Most active customers by volume.
            </p>
            <TopSendersList senders={topSenders} />
          </div>
        </div>

        {/* Bottom row: status breakdown + top sender IDs */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Status breakdown */}
          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Campaign Status Breakdown
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              Distribution of your campaigns by state.
            </p>

            {statusBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No campaigns yet.
              </p>
            ) : (
              <div className="space-y-4">
                {statusBreakdown.map((s, i) => {
                  const colors: Record<string, string> = {
                    sent: "bg-green-500",
                    scheduled: "bg-blue-500",
                    failed: "bg-red-500",
                  }
                  const color = colors[s.status] ?? "bg-gray-400"
                  return (
                    <div key={`status-${s.status ?? "unknown"}-${i}`}>
                      <div className="flex items-center justify-between mb-1.5 text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {s.status ?? "unknown"}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {s.count} ({s.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full transition-all`}
                          style={{ width: `${s.percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top sender IDs */}
          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Most Used Sender IDs
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              Which Sender IDs your customers use most.
            </p>

            {topSenderIds.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No Sender IDs used yet.
              </p>
            ) : (
              <div className="space-y-3">
                {topSenderIds.map((s, i) => (
                  <div
                    key={`sender-id-${s.senderId ?? "unknown"}-${i}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-7 items-center justify-center rounded-md bg-blue-600 text-white text-xs font-bold">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                          {s.senderId ?? "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.campaigns} campaign{s.campaigns === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {s.sent.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminContent>
  )
}