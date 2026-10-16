import { redirect } from "next/navigation"
import Link from "next/link"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { getSenderIdStats } from "@/app/actions/admin-sender-ids"
import {
  getRecentAdminActivity,
  getAttentionItems,
} from "@/app/actions/admin-activity"
import {
  AttentionWidget,
  RecentActivityWidget,
} from "@/components/admin/activity-widgets"
import { ShieldCheck, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  // Keep this — the body below uses admin.full_name
  const [admin] = await sql`
    SELECT id, username, email, full_name
    FROM admins
    WHERE id = ${session.adminId}
    LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const [stats, activity, attention] = await Promise.all([
    getSenderIdStats(),
    getRecentAdminActivity(8),
    getAttentionItems(),
  ])

  const statCards = [
    {
      label: "Total Requests",
      value: stats.total,
      color: "text-gray-900 dark:text-gray-100",
    },
    {
      label: "Pending",
      value: stats.pending,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Submitted",
      value: stats.submitted,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Approved",
      value: stats.approved,
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      color: "text-red-600 dark:text-red-400",
    },
  ]

  return (
    <AdminContent
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Overview" }]}
    >
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Welcome */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8">
          <div className="flex items-start gap-5">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 shrink-0">
              <ShieldCheck className="size-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                Welcome back, {admin.full_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                You&apos;re signed in to the CignalPulse Admin Portal.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                {stat.label}
              </p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Widgets */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AttentionWidget data={attention} />
          <RecentActivityWidget data={activity} />
        </div>

        {/* Quick link */}
        <Link
          href="/admin/sender-ids"
          className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 hover:border-blue-300 dark:hover:border-blue-900 transition-colors group flex items-center justify-between"
        >
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Manage Sender ID Requests
            </h2>
            <p className="text-sm text-muted-foreground">
              {stats.pending} request{stats.pending === 1 ? "" : "s"} waiting for
              review
            </p>
          </div>
          <ArrowRight className="size-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </AdminContent>
  )
}