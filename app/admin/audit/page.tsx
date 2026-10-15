import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { AuditLogTable } from "@/components/admin/audit-log-table"
import { listAuditLogs, getAuditStats } from "@/app/actions/admin-audit"
import { ScrollText, Clock, Calendar, UserCog } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminAuditPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name
    FROM admins
    WHERE id = ${session.adminId}
    LIMIT 1
  `
  if (!admin) redirect("/admin/login")

const [logs, stats] = await Promise.all([listAuditLogs({ limit: 200 }), getAuditStats()])
  const statCards = [
    {
      label: "Total Events",
      value: stats.total,
      icon: ScrollText,
      color: "text-gray-900 dark:text-gray-100",
      bg: "bg-gray-50 dark:bg-gray-800/50",
    },
    {
      label: "Today",
      value: stats.today,
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Last 7 Days",
      value: stats.last7Days,
      icon: Calendar,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      label: "Active Admins",
      value: stats.uniqueAdmins,
      icon: UserCog,
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
        { label: "Audit Logs" },
      ]}
    >
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every admin action recorded for compliance and debugging.
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

        <AuditLogTable logs={logs} />
      </div>
    </AdminContent>
  )
}