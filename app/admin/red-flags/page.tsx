import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { RedFlagsTable } from "@/components/admin/red-flags-table"
import { listRedFlags, getRedFlagStats } from "@/app/actions/admin-red-flags"
import { Flag, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminRedFlagsPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name FROM admins WHERE id = ${session.adminId} LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const [flags, stats] = await Promise.all([
    listRedFlags("active"),
    getRedFlagStats(),
  ])

  const statCards = [
    { label: "Active Flags", value: stats.activeFlags, icon: Flag, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30" },
    { label: "Flagged Users", value: stats.flaggedUsers, icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "High Severity", value: stats.highSeverityActive, icon: ShieldAlert, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30" },
    { label: "Cleared This Month", value: stats.clearedThisMonth, icon: CheckCircle2, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30" },
  ]

  return (
    <AdminContent
      admin={{ fullName: admin.full_name, email: admin.email, username: admin.username }}
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Red Flags" },
      ]}
    >
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Red Flags
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Users flagged for suspicious activity. Review and clear to restore sending.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                  <div className={`flex size-9 items-center justify-center rounded-lg ${stat.bg}`}>
                    <Icon className={`size-4 ${stat.color}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            )
          })}
        </div>

        <RedFlagsTable flags={flags} />
      </div>
    </AdminContent>
  )
}