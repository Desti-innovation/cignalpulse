"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { SenderIdCountdown } from "@/components/sender-id-countdown"
import { Button } from "@/components/ui/button"
import { 
  Zap, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  FileCheck2, 
  Sparkles,
  ArrowRight,
  MessageSquare,
  Home,
  Bell,
  Lightbulb,
  Users,
  FileText,
  BarChart3,
  Wallet
} from "lucide-react"

export default function SenderIdStatusPage() {
  const [targetDate] = React.useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 3)
    return date
  })

  const submittedDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const steps = [
    {
      title: "Request Submitted",
      description: "Your Sender ID request was received",
      icon: CheckCircle2,
      status: "completed",
      date: submittedDate,
    },
    {
      title: "Under Review",
      description: "Our team is verifying your documents",
      icon: Clock,
      status: "current",
      date: "In progress",
    },
    {
      title: "Regulatory Approval",
      description: "Awaiting approval from telecom provider",
      icon: ShieldCheck,
      status: "pending",
      date: "Pending",
    },
    {
      title: "Activation Complete",
      description: "Your Sender ID will be ready to use",
      icon: Sparkles,
      status: "pending",
      date: "Pending",
    },
  ]

  const tips = [
    {
      icon: Users,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50 dark:bg-blue-950",
      title: "Prepare Your Contacts",
      description: "Import and segment your contact list.",
    },
    {
      icon: FileText,
      iconColor: "text-green-600",
      iconBg: "bg-green-50 dark:bg-green-950",
      title: "Draft Your Templates",
      description: "Create your first SMS templates.",
    },
    {
      icon: BarChart3,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50 dark:bg-purple-950",
      title: "Explore Analytics",
      description: "Get familiar with the dashboard.",
    },
    {
      icon: Wallet,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-50 dark:bg-orange-950",
      title: "Top Up Your Wallet",
      description: "Add SMS credits for campaigns.",
    },
  ]

  return (
    <div className="min-h-svh bg-[#F8F9FA] dark:bg-gray-950">
      {/* Top Header */}
      <header className="flex h-16 items-center justify-between px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-700 dark:text-blue-400">
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Zap className="size-5 fill-current" />
          </div>
          CignalPulse
        </Link>
        <Button variant="ghost" size="icon" className="text-gray-500">
          <Bell className="size-5" />
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center p-6 py-10">
        <div className="w-full max-w-5xl">

          {/* Success Header (Full Width) */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50 mb-4"
            >
              <CheckCircle2 className="h-9 w-9 text-green-600 dark:text-green-400" />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-green-500"
              />
            </motion.div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Sender ID Request Received
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mb-4">
              We'll notify you by email as soon as your Sender ID is approved.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900">
              <MessageSquare className="size-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-blue-700 dark:text-blue-300">
                Request ID: <span className="font-mono font-semibold">#SID-2024-8821</span>
              </span>
            </div>
          </motion.div>

          {/* TWO-COLUMN LAYOUT */}
          <div className="grid lg:grid-cols-2 gap-6">

            {/* LEFT COLUMN: Countdown + Actions */}
            <div className="flex flex-col gap-6">
              
              {/* Countdown Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white shadow-lg relative overflow-hidden"
              >
                <div className="absolute -top-20 -right-20 size-60 rounded-full bg-blue-500 opacity-20" />
                <div className="absolute -bottom-20 -left-20 size-60 rounded-full bg-purple-500 opacity-20" />

                <div className="relative z-10 flex flex-col items-center text-center gap-5">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold mb-2">
                      <Clock className="size-3.5" />
                      Estimated Approval Time
                    </div>
                    <h2 className="text-xl font-bold">Your Sender ID will be ready in</h2>
                  </div>

                  <SenderIdCountdown targetDate={targetDate} />

                  <p className="text-xs text-blue-200">
                    Expected on{" "}
                    <span className="font-semibold">
                      {targetDate.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
              >
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4">
                  What would you like to do next?
                </h3>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                  >
                    <Home className="size-4" />
                    Go to Dashboard
                  </Link>
                  <Link
                    href="/dashboard/campaigns"
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium transition-colors"
                  >
                    <FileText className="size-4" />
                    Prepare Campaigns
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </motion.div>

            </div>

            {/* RIGHT COLUMN: Progress + Tips */}
            <div className="flex flex-col gap-6">
              
              {/* Progress Tracker */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
              >
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                  <FileCheck2 className="size-4 text-blue-600" />
                  Approval Progress
                </h3>

                <div className="flex flex-col gap-1">
                  {steps.map((step, i) => {
                    const Icon = step.icon
                    const isCompleted = step.status === "completed"
                    const isCurrent = step.status === "current"
                    const isPending = step.status === "pending"
                    const isLast = i === steps.length - 1

                    return (
                      <div key={step.title} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`
                              flex size-9 items-center justify-center rounded-full border-2 transition-all shrink-0
                              ${isCompleted ? "bg-green-500 border-green-500 text-white" : ""}
                              ${isCurrent ? "bg-blue-600 border-blue-600 text-white animate-pulse" : ""}
                              ${isPending ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400" : ""}
                            `}
                          >
                            <Icon className="size-4" />
                          </div>
                          {!isLast && (
                            <div
                              className={`
                                w-0.5 h-10 mt-1
                                ${isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-gray-800"}
                              `}
                            />
                          )}
                        </div>

                        <div className="flex-1 pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <h4
                              className={`
                                font-semibold text-xs
                                ${isCompleted ? "text-gray-900 dark:text-gray-100" : ""}
                                ${isCurrent ? "text-blue-600 dark:text-blue-400" : ""}
                                ${isPending ? "text-gray-500 dark:text-gray-500" : ""}
                              `}
                            >
                              {step.title}
                            </h4>
                            <span className="text-[10px] text-muted-foreground">{step.date}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{step.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Tips Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
              >
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Lightbulb className="size-4 text-yellow-500" />
                  While You Wait
                </h3>

                <div className="flex flex-col gap-3">
                  {tips.map((tip) => {
                    const Icon = tip.icon
                    return (
                      <div
                        key={tip.title}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900 transition-colors"
                      >
                        <div className={`flex size-8 items-center justify-center rounded-lg ${tip.iconBg} shrink-0`}>
                          <Icon className={`size-4 ${tip.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs text-gray-900 dark:text-gray-100">
                            {tip.title}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {tip.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}