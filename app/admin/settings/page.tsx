import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { AdminSettingsForm } from "@/components/admin/admin-settings-form"
import { getAdminProfile, getPlatformSettings } from "@/app/actions/admin-settings"

export const dynamic = "force-dynamic"

export default async function AdminSettingsPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name
    FROM admins
    WHERE id = ${session.adminId}
    LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const [profile, platform] = await Promise.all([
    getAdminProfile(),
    getPlatformSettings(),
  ])

  if (!profile) redirect("/admin/login")

  return (
    <AdminContent
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Settings" },
      ]}
    >
      <AdminSettingsForm profile={profile} platform={platform} />
    </AdminContent>
  )
}