"use client"

import { SenderIdForm } from "@/components/sender-id-form"
import { AnimatedSmsIllustration } from "@/components/animated-sms"
import { Zap } from "lucide-react" 

export default function SenderIdRequestPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-white dark:bg-gray-950">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-bold text-xl text-blue-700 dark:text-blue-400">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Zap className="size-5 fill-current" />
            </div>
            CignalPulse
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md">
            <SenderIdForm />
          </div>
        </div>
      </div>

      {/* Right Side - Animated Illustration */}
      <div className="relative hidden lg:block">
        <AnimatedSmsIllustration />
      </div>
    </div>
  )
}