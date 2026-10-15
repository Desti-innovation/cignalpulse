"use client"

import * as React from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { uploadLogoAction } from "@/app/actions/upload-logo"

interface LogoUploaderProps {
  currentLogo: string | null
  initials: string
  onUploaded: (url: string) => void
}

export function LogoUploader({ currentLogo, initials, onUploaded }: LogoUploaderProps) {
  const [logoUrl, setLogoUrl] = React.useState<string | null>(currentLogo)
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleClick = () => inputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append("logo", file)

    const result = await uploadLogoAction(formData)

    if (!result.success || !result.url) {
      setError(result.error || "Upload failed.")
      setIsUploading(false)
      return
    }

    setLogoUrl(result.url)
    onUploaded(result.url)
    setIsUploading(false)
  }

  const handleRemove = () => {
    setLogoUrl(null)
    onUploaded("")
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="size-28 rounded-2xl ring-2 ring-blue-100 dark:ring-blue-950">
          {logoUrl ? (
            <AvatarImage src={logoUrl} alt="Company logo" className="object-cover" />
          ) : null}
          <AvatarFallback className="rounded-2xl bg-blue-600 text-white text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        {isUploading && (
          <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
            <Loader2 className="size-8 text-white animate-spin" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={isUploading}
        >
          <Upload className="size-4 mr-2" />
          {logoUrl ? "Change Logo" : "Upload Logo"}
        </Button>

        {logoUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isUploading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <X className="size-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
      )}

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        PNG, JPG, or WEBP. Max 2MB. Square images work best.
      </p>
    </div>
  )
}