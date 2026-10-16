import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { TemplatesTable } from "@/components/admin/templates-table"
import { listTemplates } from "@/app/actions/admin-templates"

export const dynamic = "force-dynamic"

export default async function AdminTemplatesPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name FROM admins WHERE id = ${session.adminId} LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const templates = await listTemplates()

  return (
    <AdminContent
      
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Templates" },
      ]}
    >
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Message Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edit the automated messages SignalPulse sends on your behalf.
          </p>
        </div>

        <TemplatesTable templates={templates} />
      </div>
    </AdminContent>
  )
}