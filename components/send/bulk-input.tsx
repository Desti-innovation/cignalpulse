"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Users, AlertCircle, Copy } from "lucide-react"
import { parsePhoneList } from "@/lib/phone"

interface Props {
  raw: string
  onChange: (value: string) => void
  onValidCountChange: (count: number, validNumbers: string[]) => void
}

export function BulkInput({ raw, onChange, onValidCountChange }: Props) {
  const parsed = React.useMemo(() => parsePhoneList(raw), [raw])

  // Notify parent whenever the count changes
  React.useEffect(() => {
    onValidCountChange(parsed.valid.length, parsed.valid)
  }, [parsed.valid, onValidCountChange])

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="bulk-recipients" className="text-sm font-medium">
          Recipients
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5 mb-2">
          Paste phone numbers separated by newlines, commas, or spaces
        </p>
        <Textarea
          id="bulk-recipients"
          placeholder={`0241234567\n0201234567\n0551234567\n...`}
          value={raw}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[180px] text-base font-mono resize-y"
        />
      </div>

      {/* Parsing summary */}
      {raw.trim() && (
        <div className="flex flex-wrap gap-2 text-xs">
          {parsed.valid.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-semibold border border-green-200 dark:border-green-900">
              <Users className="size-3" />
              {parsed.valid.length} valid
            </span>
          )}

          {parsed.duplicates > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900">
              <Copy className="size-3" />
              {parsed.duplicates} duplicate{parsed.duplicates === 1 ? "" : "s"} removed
            </span>
          )}

          {parsed.invalid.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-semibold border border-red-200 dark:border-red-900">
              <AlertCircle className="size-3" />
              {parsed.invalid.length} invalid
            </span>
          )}
        </div>
      )}

      {/* Show first few invalid so user can correct */}
      {parsed.invalid.length > 0 && parsed.invalid.length <= 5 && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
          <p className="text-xs font-semibold text-red-800 dark:text-red-200 mb-1">
            Skipped:
          </p>
          <ul className="space-y-0.5">
            {parsed.invalid.map((inv, i) => (
              <li
                key={`inv-${i}`}
                className="text-[11px] text-red-700 dark:text-red-300 font-mono"
              >
                {inv.raw} — {inv.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}