"use client"

import * as React from "react"
import { CheckCircle2, AlertCircle, X } from "lucide-react"

interface Props {
  show: boolean
  type: "success" | "error"
  title: string
  description?: string
  onClose: () => void
  duration?: number
}

export function Toast({
  show,
  type,
  title,
  description,
  onClose,
  duration = 5000,
}: Props) {
  React.useEffect(() => {
    if (!show) return
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [show, duration, onClose])

  if (!show) return null

  const isSuccess = type === "success"

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 z-[60] md:max-w-sm animate-in slide-in-from-top-2 fade-in duration-300">
      <div
        className={`
          flex items-start gap-3 p-4 rounded-xl shadow-lg border
          ${
            isSuccess
              ? "bg-white dark:bg-gray-900 border-green-200 dark:border-green-900"
              : "bg-white dark:bg-gray-900 border-red-200 dark:border-red-900"
          }
        `}
      >
        <div
          className={`
            flex size-9 items-center justify-center rounded-full shrink-0
            ${
              isSuccess
                ? "bg-green-100 dark:bg-green-950/60"
                : "bg-red-100 dark:bg-red-950/60"
            }
          `}
        >
          {isSuccess ? (
            <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="size-5 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold ${
              isSuccess
                ? "text-green-900 dark:text-green-100"
                : "text-red-900 dark:text-red-100"
            }`}
          >
            {title}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 flex size-6 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="size-3.5 text-gray-400" />
        </button>
      </div>
    </div>
  )
}