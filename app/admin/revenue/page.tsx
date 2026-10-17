import { redirect } from "next/navigation"
import Link from "next/link"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { RevenueChart } from "@/components/admin/revenue-chart"
import {
  getRevenueOverview,
  getDailyRevenue,
  getTopSpenders,
  getBundleSalesStats,
} from "@/app/actions/admin-transactions"
import {
  Wallet,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  XCircle,
  Coins,
  Users,
  ArrowRight,
  RotateCcw,
  CreditCard,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminRevenuePage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name FROM admins WHERE id = ${session.adminId} LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const [overview, daily, topSpenders, bundleStats] = await Promise.all([
    getRevenueOverview(),
    getDailyRevenue(30),
    getTopSpenders(5),
    getBundleSalesStats(),
  ])

  const primaryCards = [
    {
      label: "Total Revenue",
      value: `₵${overview.totalRevenueGhs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`,
      subtitle: `${overview.averageTransactionGhs.toFixed(2)} avg per transaction`,
      icon: Wallet,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "This Month",
      value: `₵${overview.revenueThisMonthGhs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`,
      subtitle: "Wallet top-ups completed",
      icon: Calendar,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Today",
      value: `₵${overview.revenueTodayGhs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`,
      subtitle: `${overview.creditsSoldToday.toLocaleString()} credits sold`,
      icon: Clock,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      label: "Refunded",
      value: `₵${overview.refundedGhs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`,
      subtitle: "Total refunded to customers",
      icon: RotateCcw,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/30",
    },
  ]

  const secondaryCards = [
    {
      label: "Pending",
      value: overview.pendingTransactions,
      icon: AlertCircle,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Failed",
      value: overview.failedTransactions,
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
    },
    {
      label: "Total Credits Sold",
      value: overview.totalCreditsSold.toLocaleString(),
      icon: Coins,
      color: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "Active Wallets",
      value: overview.activeWallets,
      icon: Users,
      color: "text-teal-600 dark:text-teal-400",
    },
  ]

  const totalBundleRevenue = bundleStats.reduce((sum, b) => sum + b.revenueGhs, 0)

  return (
    <AdminContent
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Money Overview" },
      ]}
    >
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Money Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Financial health of the platform: revenue, wallet top-ups, and bundle sales.
          </p>
        </div>

        {/* Primary stat cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {primaryCards.map((stat) => {
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
                  <div className={`flex size-9 items-center justify-center rounded-lg ${stat.bg}`}>
                    <Icon className={`size-4 ${stat.color}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              </div>
            )
          })}
        </div>

        {/* Secondary stat cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {secondaryCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800/50 shrink-0">
                  <Icon className={`size-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className={`text-xl font-bold ${stat.color}`}>
                    {typeof stat.value === "number"
                      ? stat.value.toLocaleString()
                      : stat.value}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Chart */}
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              Revenue (Last 30 Days)
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Daily wallet top-ups vs internal bundle purchases.
            </p>
          </div>
          <RevenueChart data={daily} />
        </div>

        {/* Top spenders + Bundle sales */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top spenders */}
          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Users className="size-4 text-purple-600" />
                  Top Spenders
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Customers by total wallet top-up amount.
                </p>
              </div>
              <Link
                href="/admin/transactions"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all <ArrowRight className="size-3" />
              </Link>
            </div>

            {topSpenders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No top-ups yet.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {topSpenders.map((s, i) => {
                  const medals = ["bg-amber-400", "bg-gray-300", "bg-amber-700"]
                  return (
                    <div key={`spender-${s.userId}-${i}`} className="flex items-start gap-3">
                      <div
                        className={`flex size-8 items-center justify-center rounded-full text-xs font-bold text-white shrink-0 mt-0.5 ${
                          i < 3 ? medals[i] : "bg-gray-400 dark:bg-gray-700"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {s.companyName}
                          </p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                            ₵{s.totalSpentGhs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {s.transactionCount} transaction{s.transactionCount === 1 ? "" : "s"} • {s.username}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bundle sales */}
          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <CreditCard className="size-4 text-indigo-600" />
                  Bundle Sales
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Total internal revenue: ₵
                  {totalBundleRevenue.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Link
                href="/admin/bundles"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Manage <ArrowRight className="size-3" />
              </Link>
            </div>

            {bundleStats.length === 0 || totalBundleRevenue === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No bundle purchases yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {bundleStats
                  .filter((b) => b.unitsSold > 0)
                  .map((b, i) => {
                    const pct = Math.round((b.revenueGhs / totalBundleRevenue) * 100)
                    return (
                      <div key={`bundle-stat-${b.bundleId}-${i}`}>
                        <div className="flex items-center justify-between mb-1.5 text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {b.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {b.unitsSold} sold • ₵{b.revenueGhs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminContent>
  )
}