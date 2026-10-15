"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Sparkles } from "lucide-react"

export function GroupPlaceholder() {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-6 md:p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 mx-auto mb-4">
        <Users className="size-7 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
        Group Sending Coming Soon
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
        Set up contact groups to send to hundreds of people in one click.
        We're building this feature right now.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
        <Link
          href="/dashboard/contacts"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors"
        >
          <Users className="size-4" />
          Go to Contacts
        </Link>
        <Button variant="ghost" disabled className="text-xs text-muted-foreground">
          <Sparkles className="size-3.5 mr-2" />
          Coming in Phase 2
        </Button>
      </div>
    </div>
  )
}