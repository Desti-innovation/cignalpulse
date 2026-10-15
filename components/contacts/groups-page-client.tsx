"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import {
  createContactGroupAction,
  updateContactGroupAction,
  deleteContactGroupAction,
  type ContactGroup,
} from "@/app/actions/contact-groups"
import {
  Search,
  Plus,
  Users,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  Send,
} from "lucide-react"

// ============================================================
// Props
// ============================================================

interface Props {
  groups: ContactGroup[]
}

// ============================================================
// Component
// ============================================================

export function GroupsPageClient({ groups }: Props) {
  const router = useRouter()

  const [search, setSearch] = React.useState("")
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [editingGroup, setEditingGroup] = React.useState<ContactGroup | null>(null)
  const [toast, setToast] = React.useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = groups.filter((g) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      g.name.toLowerCase().includes(q) ||
      (g.description ?? "").toLowerCase().includes(q)
    )
  })

  const handleDelete = async (group: ContactGroup) => {
    if (
      !confirm(
        `Delete group "${group.name}"? Contacts in this group won't be deleted — only the grouping.`
      )
    )
      return

    const result = await deleteContactGroupAction(group.id)
    if (!result.success) {
      setToast({ type: "error", message: result.error || "Delete failed." })
      return
    }
    setToast({ type: "success", message: `Group "${group.name}" deleted.` })
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
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link href="/dashboard/contacts" className="hover:text-blue-600">
                Contacts
              </Link>
              <span>/</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Groups
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Groups
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Organize contacts into reusable lists for faster sending.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-9 md:h-10 shrink-0"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Group</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        {/* Search */}
        {groups.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        )}

        {/* Groups */}
        {groups.length === 0 ? (
          <EmptyState onCreate={() => setShowCreateModal(true)} />
        ) : filtered.length === 0 ? (
          <NoResults search={search} onClear={() => setSearch("")} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((g) => (
              <GroupCard
                key={`g-${g.id}`}
                group={g}
                onEdit={() => setEditingGroup(g)}
                onDelete={() => handleDelete(g)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <GroupFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSaved={(msg) => {
          setToast({ type: "success", message: msg })
          router.refresh()
        }}
      />

      {/* Edit modal */}
      <GroupFormModal
        open={!!editingGroup}
        onOpenChange={(open) => !open && setEditingGroup(null)}
        group={editingGroup}
        onSaved={(msg) => {
          setToast({ type: "success", message: msg })
          setEditingGroup(null)
          router.refresh()
        }}
      />
    </>
  )
}

// ============================================================
// Group card
// ============================================================

function GroupCard({
  group,
  onEdit,
  onDelete,
}: {
  group: ContactGroup
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-blue-300 dark:hover:border-blue-900 transition-colors group">
      <Link href={`/dashboard/contacts/groups/${group.id}`} className="block p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 shrink-0">
              <FolderOpen className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {group.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {group.contactCount.toLocaleString()} contact
                {group.contactCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        {group.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {group.description}
          </p>
        )}
      </Link>

      <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
        <Link
          href={`/dashboard/contacts/groups/${group.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          View group
          <ArrowRight className="size-3" />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="cursor-pointer" onClick={onEdit}>
              <Pencil className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/50"
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
              Delete group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ============================================================
// Create/Edit modal
// ============================================================

function GroupFormModal({
  open,
  onOpenChange,
  group,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: ContactGroup | null
  onSaved: (message: string) => void
}) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) setError(null)
  }, [open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const result = group
      ? await updateContactGroupAction(group.id, formData)
      : await createContactGroupAction(formData)

    if (!result.success) {
      setError(result.error || "Save failed.")
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    onOpenChange(false)
    onSaved(group ? "Group updated." : "Group created.")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{group ? "Rename Group" : "New Group"}</DialogTitle>
          <DialogDescription>
            {group
              ? "Update the name or description of this group."
              : "Create a group to organize your contacts. You can add contacts after creating it."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Group Name</FieldLabel>
              <Input
                id="name"
                name="name"
                defaultValue={group?.name ?? ""}
                placeholder="e.g. Newsletter Subscribers"
                className="h-11"
                required
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Input
                id="description"
                name="description"
                defaultValue={group?.description ?? ""}
                placeholder="Optional note about this group"
                className="h-11"
              />
              <FieldDescription>
                For your reference only — not shown to recipients.
              </FieldDescription>
            </Field>

            {error && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 dark:text-red-200 font-medium">
                  {error}
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : group ? (
                  "Save Changes"
                ) : (
                  "Create Group"
                )}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Empty / No results
// ============================================================

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-10 md:p-16 text-center">
      <div className="flex size-14 md:size-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 mx-auto mb-5">
        <FolderOpen className="size-7 md:size-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
        No groups yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
        Groups let you reuse the same set of contacts across campaigns. Create
        your first one to get started.
      </p>
      <Button
        onClick={onCreate}
        className="bg-blue-600 hover:bg-blue-700 gap-2 h-11 px-5"
      >
        <Plus className="size-4" />
        Create First Group
      </Button>
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
        No groups match <strong>&quot;{search}&quot;</strong>
      </p>
      <button
        onClick={onClear}
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
      >
        Clear search
      </button>
    </div>
  )
}