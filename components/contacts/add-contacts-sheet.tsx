"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import type { ContactGroup } from "@/app/actions/contact-groups"
import { addContactsToGroupAction } from "@/app/actions/contact-groups"
import { listContacts, type Contact } from "@/app/actions/contacts"
import {
  Search,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react"

// ============================================================
// Props
// ============================================================

interface Props {
  group: ContactGroup
  onOpenChange: (open: boolean) => void
  onAdded: (message: string) => void
}

// ============================================================
// Component
// ============================================================

export function AddContactsSheet({ group, onOpenChange, onAdded }: Props) {
  const [allContacts, setAllContacts] = React.useState<Contact[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [search, setSearch] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Load contacts when the sheet opens
  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    listContacts({ limit: 1000 }).then((list) => {
      if (!cancelled) {
        setAllContacts(list)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Reset when opened
  React.useEffect(() => {
    setSelectedIds(new Set())
    setSearch("")
    setError(null)
  }, [group.id])

  // Contacts that aren't already in this group
  const available = allContacts.filter((c) => !c.groupIds.includes(group.id))

  const filtered = available.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    const fullName = `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase()
    return c.phone.includes(q) || fullName.includes(q)
  })

  const allSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map((c) => c.id)))
  }

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleClose = () => {
    if (isSaving) return
    onOpenChange(false)
  }

  const handleAdd = async () => {
    if (selectedIds.size === 0) return
    setIsSaving(true)
    setError(null)

    const result = await addContactsToGroupAction(
      group.id,
      Array.from(selectedIds)
    )
    setIsSaving(false)

    if (!result.success) {
      setError(result.error || "Failed to add contacts.")
      return
    }

    // Close the sheet first
    onOpenChange(false)
    // Then notify parent
    onAdded(
      `${result.added} contact${result.added === 1 ? "" : "s"} added to "${group.name}".`
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Add Contacts
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              To <strong>{group.name}</strong>
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            disabled={isSaving}
            className="flex size-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {/* Select all row */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              aria-label="Select all"
            />
            <span className="text-xs text-muted-foreground">
              Select all ({filtered.length})
            </span>
            {selectedIds.size > 0 && (
              <span className="ml-auto text-xs font-medium text-blue-600 dark:text-blue-400">
                {selectedIds.size} selected
              </span>
            )}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-gray-400" />
            </div>
          ) : available.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {allContacts.length === 0
                  ? "You don't have any contacts yet."
                  : "All your contacts are already in this group."}
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <Search className="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No contacts match your search.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((c) => {
                const isSelected = selectedIds.has(c.id)
                const fullName =
                  [c.firstName, c.lastName].filter(Boolean).join(" ") ||
                  "No name"

                return (
                  <button
                    key={`pick-${c.id}`}
                    type="button"
                    onClick={() => toggle(c.id)}
                    className={`
                      w-full flex items-center gap-3 px-6 py-3 text-left transition-colors
                      ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/30"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                      }
                    `}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggle(c.id)}
                      aria-label={`Select ${fullName}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {fullName}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">
                        +{c.phone}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-3 flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
            <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 dark:text-red-200 font-medium">
              {error}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <Button
            onClick={handleAdd}
            disabled={selectedIds.size === 0 || isSaving}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4 mr-2" />
                Add {selectedIds.size > 0 ? selectedIds.size : ""} Contact
                {selectedIds.size === 1 ? "" : "s"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}