"use client"

import * as React from "react"
import Link from "next/link"
import { LoginForm } from "@/components/login-form"
import { AnimatedSmsIllustration } from "@/components/animated-sms"
import { Zap } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-svh grid lg:grid-cols-2 bg-gray-950 text-gray-100">
      {/* Left Side - Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-blue-400"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Zap className="size-5 fill-current" />
            </div>
            CignalPulse
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <React.Suspense fallback={null}>
              <LoginForm />
            </React.Suspense>
          </div>
        </div>

        <div className="text-center md:text-left text-xs text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Create one
          </Link>
        </div>
      </div>

      {/* Right Side - Animated Illustration */}
      <div className="relative hidden lg:block">
        <AnimatedSmsIllustration />
      </div>
    </div>
  )
}