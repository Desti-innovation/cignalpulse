import Link from "next/link"
import { ForgotPasswordForm } from "@/components/forgot-password-form"
import { Zap } from "lucide-react"

export const metadata = {
  title: "Forgot password · CignalPulse",
}

export default function ForgotPasswordPage() {
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
          <ForgotPasswordForm />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Remember your password?{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}