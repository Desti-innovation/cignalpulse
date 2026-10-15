"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, CheckCircle2 } from "lucide-react"

interface Props {
  onSave: () => Promise<boolean>
  disabled?: boolean
  hasChanges: boolean
}

export function SaveDraftButton({ onSave, disabled, hasChanges }: Props) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [justSaved, setJustSaved] = React.useState(false)

  const handleClick = async () => {
    setIsSaving(true)
    const success = await onSave()
    setIsSaving(false)

    if (success) {
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    }
  }

  const isDisabled = disabled || isSaving || !hasChanges

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={isDisabled}
      className="
        w-full h-12 text-sm md:text-base font-semibold
        border-gray-300 dark:border-gray-700
        hover:bg-gray-50 dark:hover:bg-gray-800
        disabled:opacity-50
      "
    >
      {isSaving ? (
        <>
          <Loader2 className="size-4 md:size-5 mr-2 animate-spin" />
          Saving...
        </>
      ) : justSaved ? (
        <>
          <CheckCircle2 className="size-4 md:size-5 mr-2 text-green-600" />
          Saved
        </>
      ) : (
        <>
          <FileText className="size-4 md:size-5 mr-2" />
          Save Draft
        </>
      )}
    </Button>
  )
}