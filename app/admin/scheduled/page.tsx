import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { ScheduledTable } from "@/components/admin/scheduled-table"
import {
  listScheduledCampaigns,
  getScheduledStats,
} from "@/app/actions/admin-scheduled"
import { Calendar, Clock, CalendarDays, Users } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminScheduledPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name FROM admins WHERE id = ${session.adminId} LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const [campaigns, stats] = await Promise.all([
    listScheduledCampaigns(),
    getScheduledStats(),
  ])

  const statCards = [
    {
      label: "Total Scheduled",
      value: stats.totalScheduled,
      icon: Calendar,
      color: "text-gray-900 dark:text-gray-100",
      bg: "bg-gray-50 dark:bg-gray-800/50",
    },
    {
      label: "Next 24 Hours",
      value: stats.next24Hours,
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "This Week",
      value: stats.thisWeek,
      icon: CalendarDays,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      label: "Users With Schedule",
      value: stats.uniqueUsers,
      icon: Users,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
  ]

  return (
    <AdminContent
      admin={{ fullName: admin.full_name, email: admin.email, username: admin.username }}
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Scheduled Jobs" },
      ]}
    >
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Scheduled Jobs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All pending scheduled SMS campaigns across the platform.
          </p>
        </div>

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
                  <div className={`flex size-9 items-center justify-center rounded-lg ${stat.bg}`}>
                    <Icon className={`size-4 ${stat.color}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            )
          })}
        </div>

        <ScheduledTable campaigns={campaigns} />
      </div>
    </AdminContent>
  )
}