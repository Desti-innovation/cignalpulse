/**
 * Minimal CSV parser. Handles:
 *   - Quoted fields with embedded commas
 *   - Escaped quotes ("")
 *   - Both \n and \r\n line endings
 *   - BOM prefix stripping
 *
 * Returns an array of objects keyed by the header row.
 */

export type ParsedCsv = {
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
}

export function parseCsv(raw: string): ParsedCsv {
  // Strip BOM if present
  let text = raw
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }

  const rows = parseRows(text)

  if (rows.length === 0) {
    return { headers: [], rows: [], totalRows: 0 }
  }

  const headers = rows[0].map((h) => h.trim())
  const dataRows = rows.slice(1).filter((row) => {
    // Ignore fully blank rows
    return row.some((cell) => cell.trim() !== "")
  })

  const objects: Record<string, string>[] = dataRows.map((row) => {
    const obj: Record<string, string> = {}
    headers.forEach((header, i) => {
      obj[header] = (row[i] ?? "").trim()
    })
    return obj
  })

  return {
    headers,
    rows: objects,
    totalRows: objects.length,
  }
}

/**
 * Splits raw text into a 2D array of cells.
 */
function parseRows(text: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ""
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          // Escaped quote
          currentCell += '"'
          i += 2
          continue
        }
        // End of quoted section
        inQuotes = false
        i++
        continue
      }
      currentCell += char
      i++
      continue
    }

    if (char === '"') {
      inQuotes = true
      i++
      continue
    }

    if (char === ",") {
      currentRow.push(currentCell)
      currentCell = ""
      i++
      continue
    }

    if (char === "\n") {
      currentRow.push(currentCell)
      rows.push(currentRow)
      currentRow = []
      currentCell = ""
      i++
      continue
    }

    if (char === "\r") {
      // Skip — we'll handle \r\n via the \n branch
      i++
      continue
    }

    currentCell += char
    i++
  }

  // Handle last cell/row
  if (currentCell !== "" || currentRow.length > 0) {
    currentRow.push(currentCell)
    rows.push(currentRow)
  }

  return rows
}