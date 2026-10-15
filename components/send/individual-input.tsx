"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, AlertCircle, Phone } from "lucide-react"
import { normalizePhone } from "@/lib/phone"

interface Props {
  phone: string
  onPhoneChange: (value: string) => void
  name: string
  onNameChange: (value: string) => void
}

export function IndividualInput({
  phone,
  onPhoneChange,
  name,
  onNameChange,
}: Props) {
  // Validate on the fly (only if there's something typed)
  const validation = phone.trim() ? normalizePhone(phone) : null

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="phone" className="text-sm font-medium">
          Phone Number
        </Label>
        <div className="relative mt-1.5">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="024 123 4567 or +233 24 123 4567"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className={`h-12 pl-10 text-base ${
              validation?.valid
                ? "border-green-400 focus-visible:ring-green-500"
                : validation && !validation.valid
                ? "border-red-300 focus-visible:ring-red-500"
                : ""
            }`}
          />
        </div>

        {/* Validation feedback */}
        {validation && validation.valid && (
          <p className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mt-2">
            <CheckCircle2 className="size-3.5" />
            {validation.display}
          </p>
        )}
        {validation && !validation.valid && (
          <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mt-2">
            <AlertCircle className="size-3.5" />
            {validation.reason}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="name" className="text-sm font-medium">
          Contact Name{" "}
          <span className="text-xs text-muted-foreground font-normal">
            (optional — for placeholders)
          </span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="e.g. John Doe"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="h-12 mt-1.5 text-base"
        />
      </div>
    </div>
  )
}