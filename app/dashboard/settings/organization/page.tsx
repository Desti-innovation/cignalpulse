import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import DashboardPage from "@/components/dashboard-content"
import { OrganizationSettings } from "@/components/organization-settings"

export const dynamic = "force-dynamic"

export default async function OrganizationSettingsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const [user] = await sql`
    SELECT 
      u.username,
      u.email,
      u.company_name,
      u.display_name,
      u.logo_url,
      u.phone,
      u.role,
      u.created_at,
      r.sender_id,
      r.status AS request_status
    FROM users u
    LEFT JOIN sender_id_requests r ON u.sender_id_request_id = r.id
    WHERE u.id = ${session.userId}
    LIMIT 1
  `

  if (!user) redirect("/login")

  const createdAt = new Date(user.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const companyName = user.display_name || user.company_name

  return (
    <DashboardPage
      user={{
        username: user.username,
        email: user.email,
        companyName,
        logoUrl: user.logo_url,
        role: user.role as "user" | "admin",
      }}
      breadcrumb="Organization"
    >
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <OrganizationSettings
          user={{
            username: user.username,
            email: user.email,
            companyName: user.company_name,
            displayName: companyName,
            logoUrl: user.logo_url,
            phone: user.phone ?? null,
            senderId: user.sender_id,
            requestStatus: user.request_status,
            createdAt,
          }}
        />
      </div>
    </DashboardPage>
  )
}