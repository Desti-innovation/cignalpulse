import Link from "next/link"
import { redirect } from "next/navigation"
import { ResetPasswordForm } from "@/components/reset-password-form"
import { Zap } from "lucide-react"

export const metadata = {
  title: "Reset password · CignalPulse",
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ identifier?: string; token?: string }>
}) {
  const { identifier, token } = await searchParams

  if (!identifier || !token) {
    redirect("/forgot-password")
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center p-6 bg-[#F8F9FA] dark:bg-gray-950">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 font-bold text-xl text-blue-700 mb-8"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Zap className="size-5 fill-current" />
          </div>
          CignalPulse
        </Link>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 md:p-8 shadow-sm">
          <ResetPasswordForm identifier={identifier} resetToken={token} />
        </div>
      </div>
    </div>
  )
}