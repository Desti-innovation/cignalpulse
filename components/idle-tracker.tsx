"use client"

import * as React from "react"
import {
  touchUserActivity,
  touchAdminActivity,
} from "@/app/actions/activity"

interface Props {
  /** Whether this is tracking a user session or admin session */
  role: "user" | "admin"
  /** Timeout in minutes */
  timeoutMinutes?: number
}

export function IdleTracker({
  role,
  timeoutMinutes = 5,
}: Props) {
  const lastPingRef = React.useRef(0)
  const idleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const loggingOutRef = React.useRef(false)

  const clearTimer = React.useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  const performLogout = React.useCallback(async () => {
    if (loggingOutRef.current) return
    loggingOutRef.current = true

    clearTimer()

    try {
      await fetch(`/api/logout?role=${role}`, {
        method: "POST",
        credentials: "same-origin",
      })
    } catch (error) {
      console.warn("[IdleTracker] Logout fetch failed:", error)
    } finally {
      window.location.href = role === "admin" ? "/admin/login" : "/login"
    }
  }, [role, clearTimer])

  const resetIdleTimer = React.useCallback(() => {
    clearTimer()

    idleTimerRef.current = setTimeout(() => {
      void performLogout()
    }, timeoutMinutes * 60 * 1000)
  }, [timeoutMinutes, clearTimer, performLogout])

  const pingServer = React.useCallback(async () => {
    const now = Date.now()
    if (now - lastPingRef.current < 2 * 60 * 1000) return
    lastPingRef.current = now

    try {
      const result =
        role === "admin"
          ? await touchAdminActivity()
          : await touchUserActivity()

      if (!result.valid) {
        void performLogout()
      }
    } catch (error) {
      console.warn("[IdleTracker] Activity ping failed:", error)
    }
  }, [role, performLogout])

  React.useEffect(() => {
    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ]

    const handleActivity = () => {
      resetIdleTimer()
      void pingServer()
    }

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        resetIdleTimer()
        void pingServer()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    resetIdleTimer()
    void pingServer()

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      document.removeEventListener("visibilitychange", handleVisibility)
      clearTimer()
    }
  }, [resetIdleTimer, pingServer, clearTimer])

  return null
}