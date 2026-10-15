"use client"

import * as React from "react"
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react"
import type {
  DailyActivityPoint,
  TopSender,
} from "@/app/actions/admin-analytics"

// ============================================================
// Activity Line Chart
// ============================================================

interface ActivityChartProps {
  data: DailyActivityPoint[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="text-center">
          <BarChart3 className="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No activity data available.
          </p>
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
            No campaigns sent in the last 30 days.
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

  const height = 260
  const width = 900
  const padding = { top: 20, right: 20, bottom: 35, left: 50 }
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

  const latest = data[data.length - 1]
  const previous = data[data.length - 2]
  const trend =
    previous && previous.sent > 0
      ? Math.round(((latest.sent - previous.sent) / previous.sent) * 100)
      : latest.sent > 0
      ? 100
      : 0

  const hoveredPoint = hoverIndex !== null ? data[hoverIndex] : null

  return (
    <div className="space-y-4">
      {/* Legend + trend */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-5 text-xs">
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

        {data.length > 1 && (
          <div className="flex items-center gap-1 text-xs">
            {trend > 0 && <TrendingUp className="size-3.5 text-green-500" />}
            {trend < 0 && <TrendingDown className="size-3.5 text-red-500" />}
            {trend === 0 && <Minus className="size-3.5 text-gray-400" />}
            <span
              className={
                trend > 0
                  ? "text-green-600 dark:text-green-400"
                  : trend < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-500 dark:text-gray-400"
              }
            >
              {trend > 0 ? "+" : ""}
              {trend}% vs previous day
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-64 min-w-[600px]"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Y-axis gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, gridIdx) => {
            const y = padding.top + chartH - p * chartH
            return (
              <g key={`grid-${gridIdx}`}>
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
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-gray-400 dark:fill-gray-600 text-[9px]"
                >
                  {Math.round(yMax * p)}
                </text>
              </g>
            )
          })}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="sentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area under sent line */}
          <polygon
            points={`${padding.left},${padding.top + chartH} ${lineFor(
              "sent"
            )} ${padding.left + chartW},${padding.top + chartH}`}
            fill="url(#sentGradient)"
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

          {/* Data point dots + hover hitboxes */}
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
            const skip = Math.max(1, Math.floor(data.length / 8))
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
                y={height - 10}
                textAnchor="middle"
                className="fill-gray-400 dark:fill-gray-600 text-[9px]"
              >
                {label}
              </text>
            )
          })}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-3 text-xs pointer-events-none z-10">
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {new Date(hoveredPoint.date).toLocaleDateString("en-GB", {
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
                  {hoveredPoint.sent}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-500" />
                <span className="text-gray-600 dark:text-gray-400">Delivered:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100 ml-auto">
                  {hoveredPoint.delivered}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-red-500" />
                <span className="text-gray-600 dark:text-gray-400">Failed:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100 ml-auto">
                  {hoveredPoint.failed}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Top Senders List
// ============================================================

interface TopSendersListProps {
  senders: TopSender[]
}

export function TopSendersList({ senders }: TopSendersListProps) {
  if (senders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No campaign data yet.</p>
      </div>
    )
  }

  const maxSent = Math.max(...senders.map((s) => s.sent), 1)
  const medals = ["bg-amber-400", "bg-gray-300", "bg-amber-700"]

  return (
    <div className="flex flex-col gap-4">
      {senders.map((s, i) => {
        const pct = Math.round((s.sent / maxSent) * 100)
        return (
          <div key={`sender-${s.userId}-${i}`} className="flex items-start gap-3">
            <div
              className={`flex size-8 items-center justify-center rounded-full text-xs font-bold text-white shrink-0 mt-0.5 ${
                i < 3 ? medals[i] : "bg-gray-400 dark:bg-gray-700"
              }`}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {s.companyName}
                </p>
                <p className="text-xs text-muted-foreground ml-2 shrink-0">
                  {s.sent.toLocaleString()}
                </p>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-muted-foreground">
                  {s.campaigns} campaign{s.campaigns === 1 ? "" : "s"}
                </p>
                <p className="text-[10px] font-medium text-green-600 dark:text-green-400">
                  {s.deliveryRate}% delivered
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}