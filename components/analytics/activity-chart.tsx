"use client"

import * as React from "react"
import { BarChart3 } from "lucide-react"

export interface ActivityPoint {
  date: string
  sent: number
  delivered: number
  failed: number
}

interface Props {
  data: ActivityPoint[]
}

export function ActivityChart({ data }: Props) {
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="text-center">
          <BarChart3 className="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        </div>
      </div>
    )
  }

  const hasData = data.some((d) => d.sent > 0 || d.delivered > 0 || d.failed > 0)

  if (!hasData) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="text-center">
          <BarChart3 className="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No campaigns in this period.
          </p>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.sent, d.delivered, d.failed)),
    1
  )
  const yMax = Math.ceil(maxValue * 1.1)

  const height = 240
  const width = 800
  const padding = { top: 16, right: 16, bottom: 32, left: 44 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
  const step = data.length > 1 ? chartW / (data.length - 1) : 0

  const pointFor = (i: number, value: number) => ({
    x: padding.left + i * step,
    y: padding.top + chartH - (value / yMax) * chartH,
  })

  const lineFor = (key: "sent" | "delivered" | "failed") =>
    data
      .map((d, i) => {
        const p = pointFor(i, d[key])
        return `${p.x},${p.y}`
      })
      .join(" ")

  const hovered = hoverIndex !== null ? data[hoverIndex] : null

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center gap-5 text-xs flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Sent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Delivered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-red-500" />
          <span className="text-gray-600 dark:text-gray-400">Failed</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 md:h-64 min-w-[500px]"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Y-axis gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = padding.top + chartH - p * chartH
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  className="stroke-gray-200 dark:stroke-gray-800"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-gray-400 dark:fill-gray-600 text-[9px]"
                >
                  {Math.round(yMax * p)}
                </text>
              </g>
            )
          })}

          {/* Area under sent line */}
          <defs>
            <linearGradient id="sentGradientUser" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`${padding.left},${padding.top + chartH} ${lineFor(
              "sent"
            )} ${padding.left + chartW},${padding.top + chartH}`}
            fill="url(#sentGradientUser)"
          />

          {/* Lines */}
          <polyline
            points={lineFor("sent")}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points={lineFor("delivered")}
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points={lineFor("failed")}
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="4 3"
          />

          {/* Hover hitboxes + dots */}
          {data.map((d, i) => {
            const p = pointFor(i, d.sent)
            const isHovered = hoverIndex === i
            return (
              <g key={`point-${d.date}-${i}`}>
                <rect
                  x={p.x - (step || 20) / 2}
                  y={padding.top}
                  width={step || 20}
                  height={chartH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIndex(i)}
                  style={{ cursor: "pointer" }}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5 : 3}
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                  className="transition-all"
                  pointerEvents="none"
                />
              </g>
            )
          })}

          {/* X-axis labels */}
          {data.map((d, i) => {
            const skip = Math.max(1, Math.floor(data.length / 7))
            if (i % skip !== 0 && i !== data.length - 1) return null
            const p = pointFor(i, 0)
            const label = new Date(d.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })
            return (
              <text
                key={`xlabel-${d.date}-${i}`}
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                className="fill-gray-400 dark:fill-gray-600 text-[9px]"
              >
                {label}
              </text>
            )
          })}
        </svg>

        {/* Tooltip */}
        {hovered && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-3 text-xs pointer-events-none z-10">
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {new Date(hovered.date).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">Sent:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100 ml-auto">
                  {hovered.sent}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Delivered:
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100 ml-auto">
                  {hovered.delivered}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-red-500" />
                <span className="text-gray-600 dark:text-gray-400">Failed:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100 ml-auto">
                  {hovered.failed}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}