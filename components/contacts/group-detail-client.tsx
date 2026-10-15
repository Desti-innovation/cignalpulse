"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddContactsSheet } from "@/components/contacts/add-contacts-sheet"
import type { ContactGroup } from "@/app/actions/contact-groups"
import {
  removeContactFromGroupAction,
} from "@/app/actions/contact-groups"
import type { Contact } from "@/app/actions/contacts"
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  Send,
  MoreHorizontal,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  UserX,
} from "lucide-react"

// ============================================================
// Props
// ============================================================

interface Props {
  group: ContactGroup
  contacts: Contact[]
}

// ============================================================
// Component
// ============================================================

export function GroupDetailClient({ group, contacts }: Props) {
  const router = useRouter()

  const [search, setSearch] = React.useState("")
  const [showAddSheet, setShowAddSheet] = React.useState(false)
  const [busyId, setBusyId] = React.useState<number | null>(null)
  const [toast, setToast] = React.useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = contacts.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    const fullName = `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase()
    return c.phone.includes(q) || fullName.includes(q)
  })

  const handleRemove = async (contact: Contact) => {
    setBusyId(contact.id)
    const result = await removeContactFromGroupAction(group.id, contact.id)
    setBusyId(null)

    if (!result.success) {
      setToast({ type: "error", message: result.error || "Remove failed." })
      return
    }

    setToast({ type: "success", message: "Contact removed from group." })
    router.refresh()
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
          <div
            className={`
              flex items-start gap-3 p-4 rounded-xl shadow-lg border
              ${
                toast.type === "success"
                  ? "bg-white dark:bg-gray-900 border-green-200 dark:border-green-900"
                  : "bg-white dark:bg-gray-900 border-red-200 dark:border-red-900"
              }
            `}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="size-5 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1">
              {toast.message}
            </p>
            <button
              onClick={() => setToast(null)}
              className="shrink-0 flex size-6 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="size-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 md:gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
        {/* Back + breadcrumb */}
        <div>
          <Link
            href="/dashboard/contacts/groups"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-3"
          >
            <ArrowLeft className="size-4" />
            Back to Groups
          </Link>

          {/* Group header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {group.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {group.contactCount.toLocaleString()} contact
                {group.contactCount === 1 ? "" : "s"}
                {group.description && ` · ${group.description}`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/dashboard/send`}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors"
              >
                <Send className="size-4" />
                <span className="hidden sm:inline">Send to Group</span>
                <span className="sm:hidden">Send</span>
              </Link>
              <Button
                onClick={() => setShowAddSheet(true)}
                className="bg-blue-600 hover:bg-blue-700 gap-2 h-10"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Contacts</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Contacts in group */}
        {contacts.length === 0 ? (
          <EmptyState onAdd={() => setShowAddSheet(true)} />
        ) : (
          <>
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts in this group..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-10 text-center">
                <Search className="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No contacts match <strong>&quot;{search}&quot;</strong>
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((c) => {
                    const isBusy = busyId === c.id
                    const fullName =
                      [c.firstName, c.lastName].filter(Boolean).join(" ") ||
                      "No name"

                    return (
                      <div
                        key={`gc-${c.id}`}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <div className="flex size-9 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 shrink-0">
                          <Users className="size-4 text-blue-600 dark:text-blue-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {fullName}
                            </p>
                            {!c.isActive && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                                <UserX className="size-2.5" />
                                OPTED OUT
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono text-muted-foreground">
                            +{c.phone}
                          </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isBusy}
                                className="size-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                              />
                            }
                          >
                            {isBusy ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="size-4" />
                            )}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/50"
                              onClick={() => handleRemove(c)}
                              disabled={isBusy}
                            >
                              <Trash2 className="size-4" />
                              Remove from group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add contacts sheet — conditionally rendered */}
      {showAddSheet && (
        <AddContactsSheet
          group={group}
          onOpenChange={setShowAddSheet}
          onAdded={(msg) => {
            setToast({ type: "success", message: msg })
            router.refresh()
          }}
        />
      )}
    </>
  )
}

// ============================================================
// Empty state
// ============================================================

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-10 md:p-16 text-center">
      <div className="flex size-14 md:size-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 mx-auto mb-5">
        <Users className="size-7 md:size-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
        This group is empty
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
        Add existing contacts to this group, or create new ones as you add them.
      </p>
      <Button
        onClick={onAdd}
        className="bg-blue-600 hover:bg-blue-700 gap-2 h-11 px-5"
      >
        <Plus className="size-4" />
        Add Contacts to Group
      </Button>
    </div>
  )
}