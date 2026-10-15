"use client"

import * as React from "react"
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react"

export type DailyRevenuePoint = {
  date: string
  walletTopups: number
  bundlePurchases: number
}

interface RevenueChartProps {
  data: DailyRevenuePoint[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="text-center">
          <BarChart3 className="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No revenue data available.</p>
        </div>
      </div>
    )
  }

  const hasData = data.some((d) => d.walletTopups > 0 || d.bundlePurchases > 0)

  if (!hasData) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="text-center">
          <BarChart3 className="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No transactions in the last 30 days.
          </p>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.walletTopups, d.bundlePurchases)),
    1
  )
  const yMax = Math.ceil(maxValue * 1.1)

  const height = 260
  const width = 900
  const padding = { top: 20, right: 20, bottom: 35, left: 55 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
  const step = data.length > 1 ? chartW / (data.length - 1) : 0

  const pointFor = (i: number, value: number) => ({
    x: padding.left + i * step,
    y: padding.top + chartH - (value / yMax) * chartH,
  })

  const lineFor = (key: "walletTopups" | "bundlePurchases") =>
    data
      .map((d, i) => {
        const p = pointFor(i, d[key])
        return `${p.x},${p.y}`
      })
      .join(" ")

  const latest = data[data.length - 1]
  const previous = data[data.length - 2]
  const latestTotal = latest.walletTopups + latest.bundlePurchases
  const previousTotal = previous
    ? previous.walletTopups + previous.bundlePurchases
    : 0
  const trend =
    previousTotal > 0
      ? Math.round(((latestTotal - previousTotal) / previousTotal) * 100)
      : latestTotal > 0
      ? 100
      : 0

  const hoveredPoint = hoverIndex !== null ? data[hoverIndex] : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-5 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-emerald-500" />
            <span className="text-gray-600 dark:text-gray-400">Wallet Top-ups</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-purple-500" />
            <span className="text-gray-600 dark:text-gray-400">Bundle Purchases</span>
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

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-64 min-w-[600px]"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHoverIndex(null)}
        >
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
                  ₵{Math.round(yMax * p)}
                </text>
              </g>
            )
          })}

          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>

          <polygon
            points={`${padding.left},${padding.top + chartH} ${lineFor(
              "walletTopups"
            )} ${padding.left + chartW},${padding.top + chartH}`}
            fill="url(#revenueGradient)"
          />

          <polyline
            points={lineFor("walletTopups")}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points={lineFor("bundlePurchases")}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="4 3"
          />

          {data.map((d, i) => {
            const p = pointFor(i, d.walletTopups)
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
                  fill="#10b981"
                  stroke="white"
                  strokeWidth="2"
                  className="transition-all"
                  pointerEvents="none"
                />
              </g>
            )
          })}

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
                <div className="size-2 rounded-full bg-emerald-500" />
                <span className="text-gray-600 dark:text-gray-400">Top-ups:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100 ml-auto">
                  ₵{hoveredPoint.walletTopups.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-purple-500" />
                <span className="text-gray-600 dark:text-gray-400">Bundles:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100 ml-auto">
                  ₵{hoveredPoint.bundlePurchases.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}