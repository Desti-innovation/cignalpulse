"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ContactEditorSheet } from "@/components/contacts/contact-editor-sheet"
import { CreateContactModal } from "@/components/contacts/create-contact-modal"
import {
  bulkDeleteContactsAction,
  type Contact,
  type ContactsStats,
} from "@/app/actions/contacts"
import type { ContactGroup } from "@/app/actions/contact-groups"
import {
  Search,
  Plus,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  ArrowRight,
  Phone,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
} from "lucide-react"

// ============================================================
// Props
// ============================================================

interface Props {
  contacts: Contact[]
  stats: ContactsStats
  groups: ContactGroup[]
}

// ============================================================
// Component
// ============================================================

export function ContactsPageClient({ contacts, stats, groups }: Props) {
  const router = useRouter()

  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "opted_out"
  >("all")
  const [groupFilter, setGroupFilter] = React.useState<string>("all")
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [editingContact, setEditingContact] = React.useState<Contact | null>(null)
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false)
  const [toast, setToast] = React.useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  // -------- Filtering --------
  const filtered = contacts.filter((c) => {
    if (statusFilter === "active" && !c.isActive) return false
    if (statusFilter === "opted_out" && c.isActive) return false
    if (groupFilter !== "all") {
      const gid = parseInt(groupFilter, 10)
      if (!c.groupIds.includes(gid)) return false
    }
    if (!search) return true
    const q = search.toLowerCase()
    const fullName = `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase()
    return (
      c.phone.toLowerCase().includes(q) ||
      fullName.includes(q)
    )
  })

  // -------- Selection --------
  const allSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)))
    }
  }

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  // -------- Bulk delete --------
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    if (!confirm(`Delete ${ids.length} contact${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) return

    setIsBulkDeleting(true)
    const result = await bulkDeleteContactsAction(ids)
    setIsBulkDeleting(false)

    if (!result.success) {
      setToast({ type: "error", message: result.error || "Delete failed." })
      return
    }

    setToast({
      type: "success",
      message: `Deleted ${result.deleted} contact${result.deleted === 1 ? "" : "s"}.`,
    })
    clearSelection()
    router.refresh()
  }

  // -------- Render --------
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

      <div className="flex flex-1 flex-col gap-4 md:gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full pb-24 md:pb-6">
        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Contacts
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your recipients and organize them into groups.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 gap-2 h-10"
          >
            <Plus className="size-4" />
            Add Contact
          </Button>
        </div>

        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Contacts
            </h2>
            <p className="text-xs text-muted-foreground">
              {stats.total} total · {stats.active} active
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-9"
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            label="Total"
            value={stats.total}
            icon={Users}
            color="text-blue-600 dark:text-blue-400"
            bg="bg-blue-50 dark:bg-blue-950/40"
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={UserCheck}
            color="text-green-600 dark:text-green-400"
            bg="bg-green-50 dark:bg-green-950/40"
          />
          <StatCard
            label="Opted Out"
            value={stats.optedOut}
            icon={UserX}
            color="text-amber-600 dark:text-amber-400"
            bg="bg-amber-50 dark:bg-amber-950/40"
          />
          <StatCard
            label="Ungrouped"
            value={stats.ungrouped}
            icon={UserPlus}
            color="text-purple-600 dark:text-purple-400"
            bg="bg-purple-50 dark:bg-purple-950/40"
          />
        </div>

        {/* Toolbar */}
        {stats.total > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>

              {/* Group filter */}
              <Select value={groupFilter} onValueChange={(v) => setGroupFilter(v ?? "all")}>
                <SelectTrigger className="h-10 w-full sm:w-[200px]">
                  <SelectValue placeholder="All groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All groups</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name} ({g.contactCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {(["all", "active", "opted_out"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize
                    ${
                      statusFilter === s
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  {s === "opted_out" ? "Opted Out" : s}
                </button>
              ))}

              {/* Bulk actions */}
              {selectedIds.size > 0 && (
                <>
                  <div className="flex-1" />
                  <span className="text-xs text-muted-foreground">
                    {selectedIds.size} selected
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearSelection}
                    className="h-8 text-xs"
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isBulkDeleting}
                    className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white gap-1.5"
                  >
                    {isBulkDeleting ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Trash2 className="size-3" />
                    )}
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Contacts */}
        {stats.total === 0 ? (
          <EmptyState onCreate={() => setShowCreateModal(true)} />
        ) : filtered.length === 0 ? (
          <NoResults
            search={search}
            onClear={() => {
              setSearch("")
              setStatusFilter("all")
              setGroupFilter("all")
            }}
          />
        ) : (
          <>
            {/* MOBILE: cards */}
            <div className="md:hidden flex flex-col gap-2">
              {/* Select all row */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
                <span className="text-xs text-muted-foreground">
                  Select all ({filtered.length})
                </span>
              </div>

              {filtered.map((c) => (
                <MobileContactCard
                  key={`mc-${c.id}`}
                  contact={c}
                  isSelected={selectedIds.has(c.id)}
                  onToggle={() => toggleOne(c.id)}
                  onEdit={() => setEditingContact(c)}
                />
              ))}
            </div>

            {/* DESKTOP: table */}
            <div className="hidden md:block rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="w-12 px-4 py-3">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={toggleAll}
                          aria-label="Select all"
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                        Phone
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                        Groups
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                        &nbsp;
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filtered.map((c, i) => {
                      const isSelected = selectedIds.has(c.id)
                      const fullName =
                        [c.firstName, c.lastName].filter(Boolean).join(" ") ||
                        "—"

                      return (
                        <tr
                          key={`c-${c.id}-${i}`}
                          className={`transition-colors ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-950/30"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleOne(c.id)}
                              aria-label={`Select ${fullName}`}
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                            {fullName}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                            +{c.phone}
                          </td>
                          <td className="px-4 py-3">
                            {c.groupNames.length === 0 ? (
                              <span className="text-xs text-muted-foreground italic">
                                Ungrouped
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {c.groupNames.slice(0, 2).map((name) => (
                                  <span
                                    key={name}
                                    className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                  >
                                    {name}
                                  </span>
                                ))}
                                {c.groupNames.length > 2 && (
                                  <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500">
                                    +{c.groupNames.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill active={c.isActive} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingContact(c)}
                              className="h-8 text-xs"
                            >
                              Edit
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create modal */}
      <CreateContactModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        groups={groups}
        onCreated={(msg) => {
          setToast({ type: "success", message: msg })
          router.refresh()
        }}
      />

      {/* Edit sheet */}
      <ContactEditorSheet
        contact={editingContact}
        groups={groups}
        onOpenChange={(open) => !open && setEditingContact(null)}
        onSaved={(msg) => {
          setToast({ type: "success", message: msg })
          setEditingContact(null)
          router.refresh()
        }}
      />
    </>
  )
}

// ============================================================
// Sub-components
// ============================================================

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
}) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 md:p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <div
          className={`flex size-7 md:size-8 items-center justify-center rounded-lg ${bg}`}
        >
          <Icon className={`size-3.5 md:size-4 ${color}`} />
        </div>
      </div>
      <p className={`text-xl md:text-2xl font-bold ${color}`}>
        {value.toLocaleString()}
      </p>
    </div>
  )
}

function StatusPill({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900">
        <CheckCircle2 className="size-3" />
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
      <UserX className="size-3" />
      Opted Out
    </span>
  )
}

function MobileContactCard({
  contact,
  isSelected,
  onToggle,
  onEdit,
}: {
  contact: Contact
  isSelected: boolean
  onToggle: () => void
  onEdit: () => void
}) {
  const fullName =
    [contact.firstName, contact.lastName].filter(Boolean).join(" ") || null

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-xl border transition-colors
        ${
          isSelected
            ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900"
            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        }
      `}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        aria-label={`Select ${fullName ?? contact.phone}`}
      />

      <button
        onClick={onEdit}
        className="flex-1 text-left min-w-0"
      >
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {fullName ?? <span className="italic text-muted-foreground">No name</span>}
          </p>
          <StatusPill active={contact.isActive} />
        </div>
        <p className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
          +{contact.phone}
        </p>
        {contact.groupNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {contact.groupNames.slice(0, 2).map((name) => (
              <span
                key={name}
                className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                {name}
              </span>
            ))}
            {contact.groupNames.length > 2 && (
              <span className="text-[9px] text-muted-foreground">
                +{contact.groupNames.length - 2}
              </span>
            )}
          </div>
        )}
      </button>

      <ArrowRight className="size-4 text-gray-400 shrink-0" />
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-10 md:p-16 text-center">
      <div className="flex size-14 md:size-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 mx-auto mb-5">
        <Users className="size-7 md:size-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
        No contacts yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
        Add your first contact manually, or import a CSV with hundreds of
        contacts at once.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button
          onClick={onCreate}
          className="bg-blue-600 hover:bg-blue-700 gap-2 h-11 px-5"
        >
          <Plus className="size-4" />
          Add First Contact
        </Button>
        <a
          href="/dashboard/contacts/import"
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors"
        >
          Import CSV
          <ArrowRight className="size-4" />
        </a>
      </div>
    </div>
  )
}

function NoResults({
  search,
  onClear,
}: {
  search: string
  onClear: () => void
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-10 text-center">
      <Search className="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground mb-4">
        {search
          ? <>No contacts match <strong>&quot;{search}&quot;</strong></>
          : "No contacts match your filters."}
      </p>
      <button
        onClick={onClear}
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
      >
        Clear filters
      </button>
    </div>
  )
}