"use client"

import * as React from "react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  Users,
  FolderOpen,
  Plus,
  AlertCircle,
  UserX,
  Sparkles,
} from "lucide-react"
import type { SendGroupOption } from "@/app/actions/send-sms"

// ============================================================
// Props
// ============================================================

interface Props {
  groups: SendGroupOption[]
  selectedIds: number[]
  onSelectionChange: (ids: number[]) => void
  /** Total unique recipients across the selected groups (computed by parent) */
  uniqueRecipientCount: number
}

// ============================================================
// Component
// ============================================================

export function GroupSelector({
  groups,
  selectedIds,
  onSelectionChange,
  uniqueRecipientCount,
}: Props) {
  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const selectAll = () => {
    onSelectionChange(groups.filter((g) => g.activeCount > 0).map((g) => g.id))
  }

  const clearAll = () => onSelectionChange([])

  // -------- Empty state --------
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-6 md:p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 mx-auto mb-4">
          <FolderOpen className="size-7 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
          No groups yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
          Create contact groups first, then send to hundreds of people in one
          click.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/dashboard/contacts/groups"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <Plus className="size-4" />
            Create a Group
          </Link>
          <Link
            href="/dashboard/contacts/import"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors"
          >
            Import Contacts
          </Link>
        </div>
      </div>
    )
  }

  // -------- Groups list --------
  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {selectedIds.length === 0
            ? "Tap a group to select it"
            : `${selectedIds.length} group${
                selectedIds.length === 1 ? "" : "s"
              } selected`}
        </p>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Clear
            </button>
          ) : (
            <button
              type="button"
              onClick={selectAll}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Select all
            </button>
          )}
        </div>
      </div>

      {/* Groups */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
        {groups.map((g) => {
          const isSelected = selectedIds.includes(g.id)
          const isDisabled = g.activeCount === 0

          return (
            <button
              key={`g-${g.id}`}
              type="button"
              onClick={() => !isDisabled && toggle(g.id)}
              disabled={isDisabled}
              className={`
                w-full flex items-center gap-3 p-4 text-left transition-colors
                ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/30"
                    : !isDisabled
                    ? "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    : ""
                }
              `}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => !isDisabled && toggle(g.id)}
                disabled={isDisabled}
                aria-label={`Select ${g.name}`}
              />

              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 shrink-0">
                <FolderOpen className="size-4 text-blue-600 dark:text-blue-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {g.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    {g.activeCount.toLocaleString()} active
                  </span>
                  {g.contactCount > g.activeCount && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      <UserX className="size-2.5" />
                      {g.contactCount - g.activeCount} opted out
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selection summary */}
      {selectedIds.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
          <Sparkles className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 dark:text-blue-200">
            <p className="font-semibold">
              {uniqueRecipientCount.toLocaleString()} unique recipient
              {uniqueRecipientCount === 1 ? "" : "s"}
            </p>
            <p className="opacity-80 mt-0.5">
              Duplicates across groups are removed automatically. Opted-out
              contacts are skipped.
            </p>
          </div>
        </div>
      )}

      {/* Warning if all selected groups are empty */}
      {selectedIds.length > 0 && uniqueRecipientCount === 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
          <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200">
            The groups you selected have no active contacts.
          </p>
        </div>
      )}
    </div>
  )
}