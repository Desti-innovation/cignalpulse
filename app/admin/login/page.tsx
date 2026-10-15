import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin-session"
import { AdminLoginForm } from "@/components/admin-login-form"
import { Zap, ShieldCheck } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminLoginPage() {
  // If already logged in as admin, redirect to /admin
  const session = await getAdminSession()
  if (session) redirect("/admin")

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left Side — Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-white dark:bg-gray-950">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-gray-100">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gray-900 dark:bg-blue-600 text-white">
              <Zap className="size-5 fill-current" />
            </div>
            SignalPulse
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
              ADMIN
            </span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <AdminLoginForm />
          </div>
        </div>
      </div>

      {/* Right Side — Restricted Panel */}
      <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center max-w-md px-10">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
            <ShieldCheck className="size-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Restricted Area
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            This portal is for SignalPulse administrators only. All actions are logged
            and audited. Unauthorized access attempts will be reported.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 w-full">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-gray-400 mt-1">Audit Trail</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-white">24h</p>
              <p className="text-xs text-gray-400 mt-1">Session Expiry</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}