"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TemplateFormModal } from "@/components/templates/template-form-modal"
import {
  deleteUserTemplateAction,
  type UserTemplate,
} from "@/app/actions/user-templates"
import { calculateSmsParts } from "@/lib/sms-parts"
import {
  Search,
  Plus,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  Loader2,
  ArrowRight,
} from "lucide-react"

// ============================================================
// Props
// ============================================================

interface Props {
  templates: UserTemplate[]
}

// ============================================================
// Component
// ============================================================

export function TemplatesPageClient({ templates }: Props) {
  const router = useRouter()

  const [search, setSearch] = React.useState("")
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [editingTemplate, setEditingTemplate] = React.useState<UserTemplate | null>(
    null
  )
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

  const filtered = templates.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q)
    )
  })

  const handleDelete = async (template: UserTemplate) => {
    if (
      !confirm(
        `Delete template "${template.name}"? This cannot be undone.`
      )
    )
      return

    setBusyId(template.id)
    const result = await deleteUserTemplateAction(template.id)
    setBusyId(null)

    if (!result.success) {
      setToast({ type: "error", message: result.error || "Delete failed." })
      return
    }

    setToast({ type: "success", message: `Template "${template.name}" deleted.` })
    router.refresh()
  }

  const handleCopy = (template: UserTemplate) => {
    navigator.clipboard.writeText(template.body)
    setToast({ type: "success", message: "Message copied to clipboard." })
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

      <div className="flex flex-1 flex-col gap-4 md:gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Templates
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Save messages you send often so you can reuse them instantly.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-9 md:h-10 shrink-0"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Template</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        {/* Search */}
        {templates.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        )}

        {/* Templates */}
        {templates.length === 0 ? (
          <EmptyState onCreate={() => setShowCreateModal(true)} />
        ) : filtered.length === 0 ? (
          <NoResults search={search} onClear={() => setSearch("")} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((template) => (
              <TemplateCard
                key={`tpl-${template.id}`}
                template={template}
                isBusy={busyId === template.id}
                onEdit={() => setEditingTemplate(template)}
                onDelete={() => handleDelete(template)}
                onCopy={() => handleCopy(template)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <TemplateFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSaved={(msg) => {
          setToast({ type: "success", message: msg })
          router.refresh()
        }}
      />

      {/* Edit modal */}
      <TemplateFormModal
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
        template={editingTemplate}
        onSaved={(msg) => {
          setToast({ type: "success", message: msg })
          setEditingTemplate(null)
          router.refresh()
        }}
      />
    </>
  )
}

// ============================================================
// Template card
// ============================================================

function TemplateCard({
  template,
  isBusy,
  onEdit,
  onDelete,
  onCopy,
}: {
  template: UserTemplate
  isBusy: boolean
  onEdit: () => void
  onDelete: () => void
  onCopy: () => void
}) {
  const parts = calculateSmsParts(template.body)

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-blue-300 dark:hover:border-blue-900 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex size-9 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40 shrink-0">
            <FileText className="size-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {template.name}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {parts.characters} chars · {parts.parts} SMS
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                disabled={isBusy}
                className="size-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 shrink-0"
              />
            }
          >
            {isBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MoreHorizontal className="size-4" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="cursor-pointer" onClick={onEdit}>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={onCopy}>
              <Copy className="size-4" />
              Copy body
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/50"
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body preview */}
      <div className="px-4 pb-4">
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 p-3">
          <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-4">
            {template.body}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Empty / No results
// ============================================================

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-10 md:p-16 text-center">
      <div className="flex size-14 md:size-16 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-950/40 mx-auto mb-5">
        <FileText className="size-7 md:size-8 text-orange-600 dark:text-orange-400" />
      </div>
      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
        No templates yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
        Save messages you send often — welcome texts, reminders, promotions — so
        you can reuse them in one click.
      </p>
      <Button
        onClick={onCreate}
        className="bg-blue-600 hover:bg-blue-700 gap-2 h-11 px-5"
      >
        <Plus className="size-4" />
        Create Your First Template
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
        No templates match <strong>&quot;{search}&quot;</strong>
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