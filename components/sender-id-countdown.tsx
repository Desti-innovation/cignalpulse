"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

interface CountdownProps {
  targetDate: Date
}

export function SenderIdCountdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  const [isExpired, setIsExpired] = React.useState(false)

  React.useEffect(() => {
    // Calculate immediately so there's no 1s flash of 00:00:00
    const tick = () => {
      const distance = targetDate.getTime() - Date.now()

      if (distance <= 0) {
        setIsExpired(true)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      })
    }

    // Run immediately on mount
    tick()

    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  // Expired state — Sender ID is ready
  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3 px-5 py-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30"
      >
        <CheckCircle2 className="size-6 text-white shrink-0" />
        <div>
          <p className="text-sm font-bold text-white">Your Sender ID is ready!</p>
          <p className="text-xs text-blue-100">Check your email for activation details.</p>
        </div>
      </motion.div>
    )
  }

  const timeUnits = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ]

  return (
    <div className="grid grid-cols-4 gap-3 w-full max-w-md">
      {timeUnits.map((unit, i) => (
        <motion.div
          key={unit.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm"
        >
          <span className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
            {String(unit.value).padStart(2, "0")}
          </span>
          <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {unit.label}
          </span>
        </motion.div>
      ))}
    </div>
  )
}