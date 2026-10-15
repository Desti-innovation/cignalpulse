import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { CompleteProfileForm } from "@/components/complete-profile-form"
import { Zap } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CompleteProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  // If they already completed, don't show this page again
  if (session.profileCompleted) redirect("/dashboard")
  if (session.firstLogin) redirect("/change-password")

  // Get fresh user data
  const [user] = await sql`
    SELECT username, email, company_name, display_name, logo_url
    FROM users
    WHERE id = ${session.userId}
    LIMIT 1
  `

  if (!user) redirect("/login")

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-white dark:bg-gray-950">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-bold text-xl text-blue-700 dark:text-blue-400">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Zap className="size-5 fill-current" />
            </div>
            SignalPulse
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md">
            <CompleteProfileForm
              username={user.username}
              email={user.email}
              companyName={user.display_name || user.company_name}
              currentLogo={user.logo_url}
            />
          </div>
        </div>
      </div>

      {/* Right: Decorative panel */}
      <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-12">
        <div className="text-center text-white max-w-md">
          <h2 className="text-3xl font-bold mb-4">
            Almost there! 🎉
          </h2>
          <p className="text-blue-100">
            Adding your logo makes SignalPulse feel like yours. This is the last step before your dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}