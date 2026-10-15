import { ChangePasswordForm } from "@/components/change-password-form"
import { Zap } from "lucide-react"

export default function ChangePasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 bg-white dark:bg-gray-950">
      <div className="flex items-center gap-2 font-bold text-xl text-blue-700 dark:text-blue-400 mb-8">
        <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Zap className="size-5 fill-current" />
        </div>
        SignalPulse
      </div>
      <div className="w-full max-w-sm">
        <ChangePasswordForm />
      </div>
    </div>
  )
}