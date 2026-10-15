"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Info } from "lucide-react"
import { calculateSmsParts } from "@/lib/sms-parts"

export type MessageTemplate = {
  id: number
  name: string
  body: string
  channel: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  templates: MessageTemplate[]
  showPlaceholders: boolean
}

export function MessageComposer({
  value,
  onChange,
  templates,
  showPlaceholders,
}: Props) {
  const parts = calculateSmsParts(value)

  const handleTemplateSelect = (templateId: string | null) => {
    if (!templateId) return
    const tpl = templates.find((t) => t.id === Number(templateId))
    if (tpl) onChange(tpl.body)
  }

  return (
    <div className="space-y-4">
      {/* ============================================================ */}
      {/* TEMPLATE SELECTOR — hidden on mobile, shown on desktop */}
      {/* ============================================================ */}
      {templates.length > 0 && (
        <div className="hidden md:block">
          <Label htmlFor="template" className="text-sm font-medium">
            Start from a Template{" "}
            <span className="text-xs text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Select onValueChange={handleTemplateSelect}>
            <SelectTrigger id="template" className="h-11 mt-1.5">
              <SelectValue placeholder="Choose a template..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  <div className="flex items-center gap-2">
                    <FileText className="size-3.5 text-gray-400" />
                    {t.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Message body */}
      <div>
        <Label htmlFor="message" className="text-sm font-medium">
          Message
        </Label>
        <Textarea
          id="message"
          placeholder="Type your SMS message here..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[140px] text-base resize-y mt-1.5"
          maxLength={1000}
        />

        {/* ============================================================ */}
        {/* CHARACTER COUNTER — full version on desktop, compact on mobile */}
        {/* ============================================================ */}
        <div className="flex items-center justify-between text-xs mt-2">
          {/* Desktop: detailed breakdown */}
          <div className="hidden md:flex items-center gap-3 text-muted-foreground flex-wrap">
            <span>
              <span
                className={
                  parts.characters > parts.perPart
                    ? "text-amber-600 dark:text-amber-400 font-semibold"
                    : ""
                }
              >
                {parts.characters}
              </span>{" "}
              characters
            </span>
            <span>·</span>
            <span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {parts.parts}
              </span>{" "}
              SMS per recipient
            </span>
            <span>·</span>
            <span className="font-mono">{parts.encoding}</span>
          </div>

          {/* Mobile: just characters · SMS */}
          <div className="flex md:hidden items-center gap-2 text-muted-foreground">
            <span>
              <span
                className={
                  parts.characters > parts.perPart
                    ? "text-amber-600 dark:text-amber-400 font-semibold"
                    : ""
                }
              >
                {parts.characters}
              </span>{" "}
              chars
            </span>
            <span>·</span>
            <span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {parts.parts}
              </span>{" "}
              SMS
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SPAM WARNING — hidden on mobile, shown on desktop */}
        {/* ============================================================ */}
        {showPlaceholders && (
          <div className="hidden md:flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 mt-3">
            <Info className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
              <p className="font-semibold mb-0.5">Avoid spam-like content</p>
              <p className="opacity-90">
                Do not include words like <em>loan</em>, <em>casino</em>,{" "}
                <em>bet</em>, <em>lottery</em>, <em>prize</em>, or{" "}
                <em>winner</em>. Messages that look like spam may cause your
                account to be flagged and suspended.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}