"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar, Clock } from "lucide-react"

interface Props {
  enabled: boolean
  onEnabledChange: (value: boolean) => void
  value: string              // "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void
}

// Returns a default scheduled time: tomorrow at 9:00am local
function defaultScheduledTime(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  // Format as "YYYY-MM-DDTHH:mm" in local time
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function SchedulePicker({
  enabled,
  onEnabledChange,
  value,
  onChange,
}: Props) {
  React.useEffect(() => {
    if (enabled && !value) {
      onChange(defaultScheduledTime())
    }
  }, [enabled, value, onChange])

  const now = new Date()
  const min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Toggle row */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/40">
            <Clock className="size-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Schedule for later
            </p>
            <p className="text-xs text-muted-foreground">
              Send at a specific date and time
            </p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>

      {/* Datetime picker */}
      {enabled && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/50">
          <Label htmlFor="scheduled-at" className="text-sm font-medium flex items-center gap-2">
            <Calendar className="size-3.5" />
            Send at
          </Label>
          <Input
            id="scheduled-at"
            type="datetime-local"
            min={min}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 mt-1.5 bg-white dark:bg-gray-900"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Credits will be deducted when the SMS is actually sent.
          </p>
        </div>
      )}
    </div>
  )
}