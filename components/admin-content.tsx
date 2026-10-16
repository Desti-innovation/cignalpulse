import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminShell, { type BreadcrumbEntry } from "@/components/admin-shell"

interface AdminContentProps {
  breadcrumbs: BreadcrumbEntry[]
  children: React.ReactNode
}

export default async function AdminContent({
  breadcrumbs,
  children,
}: AdminContentProps) {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name
    FROM admins
    WHERE id = ${session.adminId}
    LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  return (
    <AdminShell
      admin={{
        id: admin.id,
        fullName: admin.full_name,
        email: admin.email,
        username: admin.username,
      }}
      breadcrumbs={breadcrumbs}
    >
      {children}
    </AdminShell>
  )
}