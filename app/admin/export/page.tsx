import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { ExportPanel } from "@/components/admin/export-panel"
import { getTableStats } from "@/app/actions/admin-export-stats"

export const dynamic = "force-dynamic"

export default async function AdminExportPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name FROM admins WHERE id = ${session.adminId} LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const stats = await getTableStats()

  return (
    <AdminContent
      
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Data Export" },
      ]}
    >
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Data Export
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Download CSV snapshots of your platform data for backups or analysis.
          </p>
        </div>

        <ExportPanel stats={stats} />
      </div>
    </AdminContent>
  )
}