"use client"

import { User, List, Users } from "lucide-react"

export type SendMode = "individual" | "bulk" | "group"

interface Props {
  value: SendMode
  onChange: (mode: SendMode) => void
}

const MODES: Array<{
  key: SendMode
  label: string
  icon: React.ComponentType<{ className?: string }>
  hint: string
}> = [
  {
    key: "individual",
    label: "Individual",
    icon: User,
    hint: "Send to one person",
  },
  {
    key: "bulk",
    label: "Bulk",
    icon: List,
    hint: "Paste a list of numbers",
  },
  {
    key: "group",
    label: "Group",
    icon: Users,
    hint: "Pick saved groups",
  },
]

export function ModeTabs({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      {MODES.map((m) => {
        const Icon = m.icon
        const isActive = value === m.key
        return (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            className={`
              flex flex-col items-center gap-1.5 p-3 md:p-4 rounded-xl border-2 transition-all
              ${
                isActive
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700"
              }
            `}
          >
            <Icon className="size-5" />
            <span className="text-xs md:text-sm font-semibold">{m.label}</span>
            <span className="text-[10px] hidden md:block text-center opacity-70">
              {m.hint}
            </span>
          </button>
        )
      })}
    </div>
  )
}