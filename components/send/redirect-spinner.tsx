"use client"

export function RedirectSpinner() {
  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm">
      <div className="relative flex flex-col items-center gap-5">
        {/* Spinner */}
        <div className="relative flex size-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900/50" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Loading campaign...
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Just a moment
          </p>
        </div>
      </div>
    </div>
  )
}