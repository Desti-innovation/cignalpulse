"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { BadgeCheck, AlertCircle } from "lucide-react"

interface Props {
  senderIds: string[]
  value: string
  onChange: (value: string) => void
}

export function SenderIdPicker({ senderIds, value, onChange }: Props) {
  if (senderIds.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-200">
              No approved Sender ID
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              You need an approved Sender ID before you can send SMS. Contact
              support if you've already submitted a request.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Label htmlFor="sender-id" className="text-sm font-medium">
        Send From
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger id="sender-id" className="h-12 mt-1.5 text-base">
          <SelectValue placeholder="Select a Sender ID" />
        </SelectTrigger>
        <SelectContent>
          {senderIds.map((sid) => (
            <SelectItem key={sid} value={sid}>
              <div className="flex items-center gap-2">
                <BadgeCheck className="size-4 text-green-500" />
                <span className="font-mono font-semibold">{sid}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}