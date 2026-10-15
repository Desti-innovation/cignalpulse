"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ContactGroup } from "@/app/actions/contact-groups"
import {
  importContactsAction,
  type ImportRow,
} from "@/app/actions/import-contacts"
import { parseCsv } from "@/lib/csv-parse"
import { detectColumnMapping, type CsvField } from "@/lib/csv-headers"
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Users,
  Table,
  Sparkles,
  RefreshCw,
  Info,
} from "lucide-react"

// ============================================================
// Props
// ============================================================

interface Props {
  groups: ContactGroup[]
}

// ============================================================
// Types
// ============================================================

type Step = "upload" | "map" | "options" | "done"

// ============================================================
// Component
// ============================================================

export function ImportPageClient({ groups }: Props) {
  const router = useRouter()

  const [step, setStep] = React.useState<Step>("upload")
  const [fileName, setFileName] = React.useState<string>("")
  const [headers, setHeaders] = React.useState<string[]>([])
  const [previewRows, setPreviewRows] = React.useState<Record<string, string>[]>([])
  const [allRows, setAllRows] = React.useState<Record<string, string>[]>([])
  const [mapping, setMapping] = React.useState<Record<string, CsvField>>({})
  const [addToGroupId, setAddToGroupId] = React.useState<string>("none")
  const [duplicateHandling, setDuplicateHandling] = React.useState<"skip" | "update">(
    "skip"
  )
  const [isImporting, setIsImporting] = React.useState(false)
  const [result, setResult] = React.useState<{
    imported: number
    skipped: number
    updated: number
    invalid: number
    addedToGroup: number
  } | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // -------- File handling --------
  const handleFile = async (file: File) => {
    setError(null)

    if (!file.name.endsWith(".csv")) {
      setError("Only .csv files are supported. If you have Excel, save as CSV first.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Maximum 5MB.")
      return
    }

    try {
      const text = await file.text()
      const parsed = parseCsv(text)

      if (parsed.headers.length === 0) {
        setError("The CSV appears to be empty.")
        return
      }

      if (parsed.totalRows === 0) {
        setError("The CSV has headers but no data rows.")
        return
      }

      setFileName(file.name)
      setHeaders(parsed.headers)
      setPreviewRows(parsed.rows.slice(0, 5))
      setAllRows(parsed.rows)

      const detected = detectColumnMapping(parsed.headers)
      setMapping(detected)

      // If phone is not mapped, go to manual mapping step
      const hasPhone = Object.values(detected).includes("phone")
      if (hasPhone) {
        setStep("options") // skip mapping step
      } else {
        setStep("map")
      }
    } catch (err) {
      setError("Could not read the file. Make sure it's a valid CSV.")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const resetAll = () => {
    setStep("upload")
    setFileName("")
    setHeaders([])
    setPreviewRows([])
    setAllRows([])
    setMapping({})
    setResult(null)
    setError(null)
    setAddToGroupId("none")
    setDuplicateHandling("skip")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // -------- Mapping helpers --------
  const updateMapping = (header: string, field: CsvField) => {
    setMapping((prev) => {
      const next = { ...prev }

      // If this field is already mapped to another header, unmap that one
      if (field !== "skip") {
        for (const key of Object.keys(next)) {
          if (key !== header && next[key] === field) {
            next[key] = "skip"
          }
        }
      }

      next[header] = field
      return next
    })
  }

  const hasPhoneMapped = Object.values(mapping).includes("phone")
  const mappedFieldCount = Object.values(mapping).filter((v) => v !== "skip").length

  // -------- Build final rows --------
  const buildRows = (): ImportRow[] => {
    const phoneHeader = Object.keys(mapping).find((h) => mapping[h] === "phone")
    const firstNameHeader = Object.keys(mapping).find(
      (h) => mapping[h] === "first_name"
    )
    const lastNameHeader = Object.keys(mapping).find(
      (h) => mapping[h] === "last_name"
    )

    if (!phoneHeader) return []

    return allRows.map((row) => ({
      phone: row[phoneHeader] ?? "",
      firstName: firstNameHeader ? row[firstNameHeader] : undefined,
      lastName: lastNameHeader ? row[lastNameHeader] : undefined,
    }))
  }

  // -------- Import --------
  const handleImport = async () => {
    setError(null)
    const rows = buildRows()

    if (rows.length === 0) {
      setError("No data rows found.")
      return
    }

    setIsImporting(true)

    const result = await importContactsAction(rows, {
      addToGroupId:
        addToGroupId === "none" ? null : parseInt(addToGroupId, 10),
      duplicateHandling,
    })

    setIsImporting(false)

    if (!result.success) {
      setError(result.error || "Import failed.")
      return
    }

    setResult({
      imported: result.imported ?? 0,
      skipped: result.skipped ?? 0,
      updated: result.updated ?? 0,
      invalid: result.invalid ?? 0,
      addedToGroup: result.addedToGroup ?? 0,
    })
    setStep("done")
    router.refresh()
  }

  // -------- Render --------
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6 p-4 md:p-6 max-w-3xl mx-auto w-full">
      {/* Back */}
      <Link
        href="/dashboard/contacts"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 w-fit"
      >
        <ArrowLeft className="size-4" />
        Back to Contacts
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Import Contacts
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a CSV file with your contacts. Up to 10,000 per file.
        </p>
      </div>

      {/* Progress indicator */}
      {step !== "done" && (
        <div className="flex items-center gap-2">
          <StepDot
            active={step === "upload"}
            done={step !== "upload"}
            number={1}
            label="Upload"
          />
          <StepLine />
          <StepDot
            active={step === "map"}
            done={step === "options"}
            number={2}
            label="Map"
          />
          <StepLine />
          <StepDot
            active={step === "options"}
            done={false}
            number={3}
            label="Options"
          />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
          <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-200 font-medium flex-1">
            {error}
          </p>
          <button onClick={() => setError(null)}>
            <X className="size-4 text-red-600" />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 1 — UPLOAD */}
      {/* ============================================================ */}
      {step === "upload" && (
        <>
          {/* Sample template */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900 p-5 md:p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Use our template for best results
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The template has the exact headers we recognize automatically.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900 p-4 mb-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Expected format
              </p>
              <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
{`phone,first_name,last_name
233241234567,John,Doe
233201234567,Jane,Smith`}
              </pre>
            </div>

            <a
              href="/api/sample-contacts"
              download
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <Download className="size-4" />
              Download Sample CSV
            </a>
          </div>

          {/* Upload area */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`
              rounded-2xl border-2 border-dashed transition-colors p-8 md:p-12 text-center
              ${
                isDragging
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 mx-auto mb-4">
              <Upload className="size-7 text-blue-600 dark:text-blue-400" />
            </div>

            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Drop your CSV here
            </h3>
            <p className="text-xs text-muted-foreground mb-5">
              Or click to browse. Max 5MB, up to 10,000 contacts.
            </p>

            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 h-11 px-6"
            >
              <FileText className="size-4 mr-2" />
              Choose File
            </Button>
          </div>

          {/* Tips */}
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-start gap-3">
              <Info className="size-4 text-gray-500 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Supported headers (case-insensitive):
                </p>
                <ul className="space-y-0.5">
                  <li>
                    <strong>Phone:</strong> phone, mobile, tel, msisdn, contact,
                    number
                  </li>
                  <li>
                    <strong>First name:</strong> first_name, firstname, fname,
                    given name
                  </li>
                  <li>
                    <strong>Last name:</strong> last_name, lastname, lname,
                    surname
                  </li>
                </ul>
                <p className="mt-2">
                  Don't worry if your headers don't match — we'll let you map
                  them manually in the next step.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* STEP 2 — MAP */}
      {/* ============================================================ */}
      {step === "map" && (
        <>
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4 flex items-start gap-3">
            <Table className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-0.5">
                {mappedFieldCount} of {headers.length} columns detected
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                We auto-matched the columns we recognized. Map any remaining
                ones — or leave them as "Skip".
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Map Columns
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                File: <strong>{fileName}</strong> · {allRows.length} rows
              </p>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {headers.map((header) => {
                const currentField = mapping[header] ?? "skip"
                const sampleValue = previewRows[0]?.[header] ?? ""

                return (
                  <div
                    key={header}
                    className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3"
                  >
                    {/* Left: original column + sample */}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {header}
                      </p>
                      {sampleValue && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Example: <span className="font-mono">{sampleValue}</span>
                        </p>
                      )}
                    </div>

                    {/* Right: field selector */}
                    <div className="flex items-center gap-2 md:w-[220px]">
                      <ArrowRight className="size-4 text-gray-400 shrink-0 hidden md:block" />
                      <Select
                        value={currentField}
                        onValueChange={(v) =>
                          updateMapping(header, (v ?? "skip") as CsvField)
                        }
                      >
                        <SelectTrigger className="h-10 flex-1">
                          <SelectValue placeholder="Skip" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">
                            <span className="text-muted-foreground">
                              Skip this column
                            </span>
                          </SelectItem>
                          <SelectItem value="phone">
                            Phone <span className="text-red-500">*</span>
                          </SelectItem>
                          <SelectItem value="first_name">First Name</SelectItem>
                          <SelectItem value="last_name">Last Name</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Missing phone warning */}
          {!hasPhoneMapped && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
              <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                You must map at least one column to <strong>Phone</strong> to
                continue.
              </p>
            </div>
          )}

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={resetAll} className="h-11">
              <ArrowLeft className="size-4 mr-2" />
              Change file
            </Button>
            <Button
              onClick={() => setStep("options")}
              disabled={!hasPhoneMapped}
              className="bg-blue-600 hover:bg-blue-700 h-11 px-6"
            >
              Continue
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* STEP 3 — OPTIONS */}
      {/* ============================================================ */}
      {step === "options" && (
        <>
          {/* Preview */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Preview
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Showing first {Math.min(5, allRows.length)} of{" "}
                    {allRows.length.toLocaleString()} rows
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 text-xs font-semibold border border-green-200 dark:border-green-900">
                  <CheckCircle2 className="size-3" />
                  {allRows.length.toLocaleString()} ready
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                  <tr>
                    {Object.entries(mapping)
                      .filter(([_, v]) => v !== "skip")
                      .map(([header, field]) => (
                        <th
                          key={header}
                          className="text-left px-4 py-2.5 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400"
                        >
                          {field === "phone"
                            ? "Phone"
                            : field === "first_name"
                            ? "First Name"
                            : "Last Name"}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {previewRows.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {Object.entries(mapping)
                        .filter(([_, v]) => v !== "skip")
                        .map(([header]) => (
                          <td
                            key={header}
                            className="px-4 py-2.5 text-xs font-mono text-gray-700 dark:text-gray-300 max-w-[200px] truncate"
                          >
                            {row[header] ?? "—"}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import options */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 space-y-5">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Import Options
            </h3>

            {/* Group */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                Add to Group (optional)
              </label>
              <Select value={addToGroupId} onValueChange={(v) => setAddToGroupId(v ?? "none")}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="No group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No group</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                All imported contacts will be added to this group.
              </p>
            </div>

            {/* Duplicates */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                Duplicate phone numbers
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDuplicateHandling("skip")}
                  className={`
                    p-3 rounded-lg border-2 text-left transition-colors
                    ${
                      duplicateHandling === "skip"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
                    }
                  `}
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Skip
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Leave existing contacts unchanged
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateHandling("update")}
                  className={`
                    p-3 rounded-lg border-2 text-left transition-colors
                    ${
                      duplicateHandling === "update"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
                    }
                  `}
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Update
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Overwrite names with new data
                  </p>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={resetAll} className="h-11">
              <ArrowLeft className="size-4 mr-2" />
              Start over
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting}
              className="bg-blue-600 hover:bg-blue-700 h-11 px-6"
            >
              {isImporting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="size-4 mr-2" />
                  Import {allRows.length.toLocaleString()} Contacts
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* STEP 4 — DONE */}
      {/* ============================================================ */}
      {step === "done" && result && (
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-500 mx-auto mb-5">
            <CheckCircle2 className="size-8 text-white" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Import Complete
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Here's a summary of what was imported.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <SummaryCard
              label="Imported"
              value={result.imported}
              color="text-green-600 dark:text-green-400"
            />
            <SummaryCard
              label="Updated"
              value={result.updated}
              color="text-blue-600 dark:text-blue-400"
            />
            <SummaryCard
              label="Skipped"
              value={result.skipped}
              color="text-amber-600 dark:text-amber-400"
            />
            <SummaryCard
              label="Invalid"
              value={result.invalid}
              color="text-red-600 dark:text-red-400"
            />
          </div>

          {result.addedToGroup > 0 && (
            <div className="mb-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 inline-flex items-center gap-2">
              <Users className="size-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {result.addedToGroup} added to group
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard/contacts"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <Users className="size-4" />
              View Contacts
            </Link>
            <Button
              variant="outline"
              onClick={resetAll}
              className="h-11 px-6"
            >
              <RefreshCw className="size-4 mr-2" />
              Import Another
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function StepDot({
  active,
  done,
  number,
  label,
}: {
  active: boolean
  done: boolean
  number: number
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors
          ${
            done
              ? "bg-green-500 text-white"
              : active
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500"
          }
        `}
      >
        {done ? <CheckCircle2 className="size-4" /> : number}
      </div>
      <span
        className={`text-xs font-medium hidden sm:inline ${
          active || done
            ? "text-gray-900 dark:text-gray-100"
            : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  )
}

function StepLine() {
  return (
    <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-800 rounded-full max-w-[60px]" />
  )
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
    </div>
  )
}