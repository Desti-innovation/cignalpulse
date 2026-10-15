import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { CronJobsTable } from "@/components/admin/cron-jobs-table"
import { listCronJobs } from "@/app/actions/admin-crons"

export const dynamic = "force-dynamic"

export default async function AdminCronsPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name FROM admins WHERE id = ${session.adminId} LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const jobs = await listCronJobs()

  return (
    <AdminContent
      admin={{ fullName: admin.full_name, email: admin.email, username: admin.username }}
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Cron Health" },
      ]}
    >
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Cron Health
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor the background jobs running across the platform.
          </p>
        </div>

        <CronJobsTable jobs={jobs} />
      </div>
    </AdminContent>
  )
}