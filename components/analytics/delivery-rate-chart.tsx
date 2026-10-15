"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"

interface Props {
  data: Array<{ date: string; rate: number; sent: number; delivered: number }>
}

export function DeliveryRateChart({ data }: Props) {
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="text-center">
          <TrendingUp className="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No delivery data yet.
          </p>
        </div>
      </div>
    )
  }

  const hasData = data.some((d) => d.sent > 0)
  if (!hasData) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="text-center">
          <TrendingUp className="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No campaigns in this period.
          </p>
        </div>
      </div>
    )
  }

  const height = 220
  const width = 800
  const padding = { top: 16, right: 16, bottom: 32, left: 44 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
  const step = data.length > 1 ? chartW / (data.length - 1) : 0

  const pointFor = (i: number, rate: number) => ({
    x: padding.left + i * step,
    y: padding.top + chartH - (rate / 100) * chartH,
  })

  const linePoints = data
    .map((d, i) => {
      const p = pointFor(i, d.rate)
      return `${p.x},${p.y}`
    })
    .join(" ")

  const hovered = hoverIndex !== null ? data[hoverIndex] : null

  return (
    <div className="space-y-3">
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-52 min-w-[500px]"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Gridlines */}
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
                  {Math.round(p * 100)}%
                </text>
              </g>
            )
          })}

          {/* Area under line */}
          <defs>
            <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`${padding.left},${padding.top + chartH} ${linePoints} ${
              padding.left + chartW
            },${padding.top + chartH}`}
            fill="url(#rateGradient)"
          />

          {/* Line */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Hitboxes + dots */}
          {data.map((d, i) => {
            const p = pointFor(i, d.rate)
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
                  fill="#22c55e"
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

        {hovered && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-3 text-xs pointer-events-none z-10">
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {new Date(hovered.date).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
            <p className="text-green-600 dark:text-green-400 font-bold text-base">
              {hovered.rate}%
            </p>
            <p className="text-muted-foreground text-[10px] mt-1">
              {hovered.delivered} / {hovered.sent} delivered
            </p>
          </div>
        )}
      </div>
    </div>
  )
}