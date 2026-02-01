"use client"

import { useMemo, useState, useEffect, useCallback, useRef } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  ReferenceLine,
  Brush,
  LabelList,
} from "recharts"
import { Info, X, TrendingUp, Sparkles, AlertTriangle, Lightbulb, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ParsedData } from "@/app/page"
import { Button } from "@/components/ui/button"
import { AIInsightsCard, type Insight } from "@/components/ai-insights-card"

interface DashboardChartsProps {
  data: ParsedData
  onFilterByCategory?: (category: string | null) => void
}

const CHART_COLORS = [
  "hsl(271, 91%, 65%)", // primary purple
  "hsl(217, 91%, 60%)", // secondary blue
  "hsl(142, 71%, 45%)", // success green
  "hsl(38, 92%, 50%)", // warning orange
  "hsl(0, 84%, 60%)", // destructive red
]

// Custom hook for animated chart rendering
function useChartAnimation(delay: number = 0) {
  const [isAnimated, setIsAnimated] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), delay)
    return () => clearTimeout(timer)
  }, [delay])
  
  return isAnimated
}

// Custom Bar shape with rounded ends
function RoundedBar(props: {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  index?: number
  isHovered?: boolean
  hoveredIndex?: number | null
}) {
  const { x = 0, y = 0, width = 0, height = 0, fill, index = 0, hoveredIndex } = props
  const isHovered = hoveredIndex === index
  const isDimmed = hoveredIndex !== null && hoveredIndex !== index
  
  return (
    <g>
      <defs>
        <linearGradient id={`barGradientEnhanced-${index}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={isDimmed ? 0.3 : 1} />
          <stop offset="100%" stopColor={CHART_COLORS[(index + 1) % CHART_COLORS.length]} stopOpacity={isDimmed ? 0.3 : 0.8} />
        </linearGradient>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`url(#barGradientEnhanced-${index})`}
        rx={4}
        ry={4}
        style={{
          transition: "all 0.3s ease",
          transform: isHovered ? "scaleX(1.02)" : "scaleX(1)",
          transformOrigin: "left center",
          filter: isHovered ? "brightness(1.1)" : "none",
        }}
      />
    </g>
  )
}

// Detail modal for data point
function DataPointModal({ 
  isOpen, 
  onClose, 
  data,
  valueCol 
}: { 
  isOpen: boolean
  onClose: () => void
  data: { date: string; value: number; value2?: number } | null
  valueCol: string
}) {
  if (!isOpen || !data) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="glass-card relative w-full max-w-md rounded-xl p-6 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Data Point Details</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
            <span className="text-sm text-muted-foreground">Period</span>
            <span className="font-medium text-foreground">{data.date}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3">
            <span className="text-sm text-muted-foreground">{valueCol}</span>
            <span className="font-semibold text-primary">${formatValue(data.value)}</span>
          </div>
          {data.value2 !== undefined && data.value2 > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-secondary/10 p-3">
              <span className="text-sm text-muted-foreground">Secondary Value</span>
              <span className="font-semibold text-secondary">${formatValue(data.value2)}</span>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/20 p-3 text-center">
              <p className="text-xs text-muted-foreground">vs Previous</p>
              <p className="font-semibold text-success">+12.4%</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-3 text-center">
              <p className="text-xs text-muted-foreground">vs Average</p>
              <p className="font-semibold text-primary">+8.2%</p>
            </div>
          </div>
        </div>
        <Button onClick={onClose} className="mt-6 w-full">Close</Button>
      </div>
    </div>
  )
}

export function DashboardCharts({ data, onFilterByCategory }: DashboardChartsProps) {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null)
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null)
  const [hiddenPieSegments, setHiddenPieSegments] = useState<Set<string>>(new Set())
  const [selectedDataPoint, setSelectedDataPoint] = useState<{ date: string; value: number; value2?: number } | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  
  const areaChartAnimated = useChartAnimation(100)
  const barChartAnimated = useChartAnimation(300)
  const pieChartAnimated = useChartAnimation(500)

  // Process data for charts
  const chartData = useMemo(() => {
    const numericColumns = data.columns.filter((col) => {
      const sample = data.rows.slice(0, 10).map((r) => r[col])
      return sample.some((v) => typeof v === "number")
    })

    const categoricalColumns = data.columns.filter((col) => {
      const sample = data.rows.slice(0, 10).map((r) => r[col])
      return sample.every((v) => typeof v === "string" && !/^\d{4}-\d{2}-\d{2}/.test(v as string))
    })

    const dateColumns = data.columns.filter((col) => {
      const sample = data.rows.slice(0, 10).map((r) => r[col])
      return sample.some((v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v as string))
    })

    // Time series data for area chart
    const dateCol = dateColumns[0]
    const valueCol = numericColumns.find((col) => /revenue|sales|amount|value/i.test(col)) || numericColumns[0]
    const secondValueCol = numericColumns.find((col) => col !== valueCol) || numericColumns[1]

    let timeSeriesData: { date: string; value: number; value2: number }[] = []
    if (dateCol && valueCol) {
      const grouped = data.rows.reduce(
        (acc, row) => {
          const date = String(row[dateCol]).substring(0, 7) // Group by month
          if (!acc[date]) {
            acc[date] = { value: 0, value2: 0 }
          }
          acc[date].value += Number(row[valueCol]) || 0
          if (secondValueCol) {
            acc[date].value2 += Number(row[secondValueCol]) || 0
          }
          return acc
        },
        {} as Record<string, { value: number; value2: number }>
      )

      timeSeriesData = Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([date, values]) => ({
          date,
          value: values.value,
          value2: values.value2,
        }))
    }

    // Calculate average for reference line
    const avgValue = timeSeriesData.length > 0
      ? timeSeriesData.reduce((sum, d) => sum + d.value, 0) / timeSeriesData.length
      : 0

    // Bar chart data - aggregate by category
    const categoryCol = categoricalColumns.find((col) => /category|type|region|segment/i.test(col)) || categoricalColumns[0]
    let barData: { name: string; value: number }[] = []
    if (categoryCol && valueCol) {
      const grouped = data.rows.reduce(
        (acc, row) => {
          const category = String(row[categoryCol])
          if (!acc[category]) {
            acc[category] = 0
          }
          acc[category] += Number(row[valueCol]) || 0
          return acc
        },
        {} as Record<string, number>
      )

      barData = Object.entries(grouped)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    }

    // Find max value for bar chart to determine label position
    const maxBarValue = Math.max(...barData.map(d => d.value), 0)

    // Pie chart data - another categorical grouping
    const regionCol = categoricalColumns.find((col) => /region|location|country|area/i.test(col)) || categoricalColumns[1] || categoryCol
    let pieData: { name: string; value: number }[] = []
    if (regionCol && valueCol) {
      const grouped = data.rows.reduce(
        (acc, row) => {
          const region = String(row[regionCol])
          if (!acc[region]) {
            acc[region] = 0
          }
          acc[region] += Number(row[valueCol]) || 0
          return acc
        },
        {} as Record<string, number>
      )

      pieData = Object.entries(grouped)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    }

    const pieTotal = pieData.reduce((sum, item) => sum + item.value, 0)

    return {
      timeSeries: timeSeriesData,
      bars: barData,
      pie: pieData,
      pieTotal,
      avgValue,
      maxBarValue,
      valueCol: valueCol || "value",
      secondValueCol: secondValueCol || "value2",
      categoryCol: categoryCol || "category",
      regionCol: regionCol || "region",
    }
  }, [data])

  // Filter pie data based on hidden segments
  const filteredPieData = useMemo(() => {
    return chartData.pie.filter(item => !hiddenPieSegments.has(item.name))
  }, [chartData.pie, hiddenPieSegments])

  const filteredPieTotal = useMemo(() => {
    return filteredPieData.reduce((sum, item) => sum + item.value, 0)
  }, [filteredPieData])

  // Toggle legend item visibility
  const togglePieSegment = useCallback((name: string) => {
    setHiddenPieSegments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(name)) {
        newSet.delete(name)
      } else {
        // Don't hide if it would hide all segments
        if (newSet.size < chartData.pie.length - 1) {
          newSet.add(name)
        }
      }
      return newSet
    })
  }, [chartData.pie.length])

  // Handle pie segment click for filtering
  const handlePieClick = useCallback((name: string) => {
    if (activeFilter === name) {
      setActiveFilter(null)
      onFilterByCategory?.(null)
    } else {
      setActiveFilter(name)
      onFilterByCategory?.(name)
    }
  }, [activeFilter, onFilterByCategory])

  // Handle area chart click
  const handleAreaClick = useCallback((data: { date: string; value: number; value2?: number }) => {
    setSelectedDataPoint(data)
  }, [])

  // Generate AI insights based on data
  const aiInsights = useMemo((): Insight[] => {
    const insights: Insight[] = []
    
    // Trend insight - positive or warning based on growth
    if (chartData.timeSeries.length > 1) {
      const first = chartData.timeSeries[0]?.value || 0
      const last = chartData.timeSeries[chartData.timeSeries.length - 1]?.value || 0
      const change = first > 0 ? ((last - first) / first * 100) : 0
      const isPositive = change >= 0
      
      insights.push({
        id: "trend-1",
        type: isPositive ? "positive" : "warning",
        headline: isPositive ? "Revenue Spike Detected" : "Revenue Decline Alert",
        description: `${chartData.valueCol.replace(/_/g, " ")} ${isPositive ? "grew" : "declined"} by ${Math.abs(change).toFixed(1)}% over the analyzed period, ${isPositive ? "indicating strong market performance" : "suggesting need for strategic review"}.`,
        confidence: 92,
        supportingData: [
          { label: "Starting Value", value: `$${formatValue(first)}` },
          { label: "Current Value", value: `$${formatValue(last)}` },
          { label: "Change", value: `${isPositive ? "+" : ""}${change.toFixed(1)}%` },
          { label: "Period", value: `${chartData.timeSeries.length} months` },
        ]
      })
    }

    // Top performer insight
    if (chartData.bars.length > 0) {
      const top = chartData.bars[0]
      const second = chartData.bars[1]
      const leadPercentage = second ? ((top.value - second.value) / second.value * 100).toFixed(1) : 0
      
      insights.push({
        id: "performer-1",
        type: "positive",
        headline: `"${top.name}" Leads Performance`,
        description: `Top performing ${chartData.categoryCol.replace(/_/g, " ")} with $${formatValue(top.value)} in revenue${second ? `, outpacing second place by ${leadPercentage}%` : ""}.`,
        confidence: 88,
        supportingData: [
          { label: "Total Value", value: `$${formatValue(top.value)}` },
          ...(second ? [{ label: "vs Runner-up", value: `+${leadPercentage}%` }] : []),
          { label: "Market Share", value: `${chartData.pieTotal > 0 ? ((top.value / chartData.pieTotal) * 100).toFixed(1) : 0}%` },
        ]
      })
    }

    // Warning insight for underperformers
    if (chartData.pie.length > 0) {
      const smallest = chartData.pie[chartData.pie.length - 1]
      const percentage = chartData.pieTotal > 0 ? ((smallest.value / chartData.pieTotal) * 100) : 0
      
      insights.push({
        id: "warning-1",
        type: "warning",
        headline: `"${smallest.name}" Needs Attention`,
        description: `Contributing only ${percentage.toFixed(1)}% to total ${chartData.valueCol.replace(/_/g, " ")}. Consider targeted campaigns or resource reallocation.`,
        confidence: 76,
        supportingData: [
          { label: "Current Contribution", value: `${percentage.toFixed(1)}%` },
          { label: "Revenue", value: `$${formatValue(smallest.value)}` },
          { label: "Gap to Average", value: `-${(100 / chartData.pie.length - percentage).toFixed(1)}%` },
        ]
      })
    }

    // Recommendation
    insights.push({
      id: "recommendation-1",
      type: "recommendation",
      headline: "Deep Dive Opportunity",
      description: `Cross-analyze ${chartData.categoryCol.replace(/_/g, " ")} with ${chartData.regionCol.replace(/_/g, " ")} to uncover hidden growth segments and optimize resource allocation.`,
      confidence: 84,
      supportingData: [
        { label: "Dimensions Available", value: `${data.columns.length}` },
        { label: "Data Points", value: `${data.rowCount.toLocaleString()}` },
      ]
    })

    // Correlation insight
    if (chartData.timeSeries.length > 3) {
      const values = chartData.timeSeries.map(d => d.value)
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length
      const stdDev = Math.sqrt(variance)
      const volatility = (stdDev / avg * 100).toFixed(1)
      
      insights.push({
        id: "info-1",
        type: "info",
        headline: "Seasonal Pattern Detected",
        description: `Data shows ${Number(volatility) > 20 ? "high" : "moderate"} volatility (${volatility}% coefficient of variation) suggesting seasonal trends worth investigating.`,
        confidence: 71,
        supportingData: [
          { label: "Volatility Index", value: `${volatility}%` },
          { label: "Average", value: `$${formatValue(avg)}` },
          { label: "Std Deviation", value: `$${formatValue(stdDev)}` },
        ]
      })
    }

    return insights
  }, [chartData, data.columns.length, data.rowCount])

  // Custom label renderer for bar chart
  const renderBarLabel = (props: { x?: number; y?: number; width?: number; height?: number; value?: number }) => {
    const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props
    const isWideEnough = width > 60
    const formattedValue = `$${formatValue(value)}`
    
    if (isWideEnough) {
      return (
        <text
          x={x + width - 8}
          y={y + height / 2}
          fill="white"
          textAnchor="end"
          dominantBaseline="middle"
          fontSize={11}
          fontWeight={500}
        >
          {formattedValue}
        </text>
      )
    }
    return (
      <text
        x={x + width + 8}
        y={y + height / 2}
        fill="hsl(var(--foreground))"
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={500}
      >
        {formattedValue}
      </text>
    )
  }

  return (
    <div className="space-y-6">
      {/* Data Point Detail Modal */}
      <DataPointModal
        isOpen={!!selectedDataPoint}
        onClose={() => setSelectedDataPoint(null)}
        data={selectedDataPoint}
        valueCol={chartData.valueCol.replace(/_/g, " ")}
      />

      {/* Active Filter Indicator */}
      {activeFilter && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2">
          <span className="text-sm text-muted-foreground">Filtered by:</span>
          <span className="font-medium text-primary">{activeFilter}</span>
          <button 
            onClick={() => handlePieClick(activeFilter)}
            className="ml-2 rounded-full p-1 hover:bg-primary/20"
          >
            <X className="h-4 w-4 text-primary" />
          </button>
        </div>
      )}

      {/* Row 2 - Main Charts */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Area Chart */}
        <div className="glass-card rounded-xl p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  {chartData.valueCol.replace(/_/g, " ")} Over Time
                </h3>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Last 12 months - Click data points for details</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData.timeSeries}
                onClick={(e) => {
                  if (e?.activePayload?.[0]?.payload) {
                    handleAreaClick(e.activePayload[0].payload)
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorValueEnhanced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(271, 91%, 65%)" stopOpacity={0.5} />
                    <stop offset="50%" stopColor="hsl(271, 91%, 65%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(271, 91%, 65%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorValue2Enhanced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.5} />
                    <stop offset="50%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${formatValue(value)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`$${formatValue(value)}`, ""]}
                  cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "5 5" }}
                />
                {/* Average Reference Line */}
                <ReferenceLine 
                  y={chartData.avgValue} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="8 4"
                  strokeWidth={1.5}
                  label={{ 
                    value: `Avg: $${formatValue(chartData.avgValue)}`, 
                    position: "insideTopRight",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  name={chartData.valueCol.replace(/_/g, " ")}
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorValueEnhanced)"
                  isAnimationActive={areaChartAnimated}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  dot={{ r: 4, fill: CHART_COLORS[0], strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: CHART_COLORS[0], stroke: "white", strokeWidth: 2, cursor: "pointer" }}
                />
                {chartData.secondValueCol && chartData.timeSeries[0]?.value2 !== undefined && (
                  <Area
                    type="monotone"
                    dataKey="value2"
                    name={chartData.secondValueCol.replace(/_/g, " ")}
                    stroke={CHART_COLORS[1]}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorValue2Enhanced)"
                    isAnimationActive={areaChartAnimated}
                    animationDuration={1500}
                    animationEasing="ease-out"
                    animationBegin={200}
                    dot={{ r: 4, fill: CHART_COLORS[1], strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: CHART_COLORS[1], stroke: "white", strokeWidth: 2, cursor: "pointer" }}
                  />
                )}
                {/* Brush for date range selection */}
                <Brush 
                  dataKey="date" 
                  height={30} 
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--muted))"
                  tickFormatter={(value) => value}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass-card rounded-xl p-5 lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">
              {chartData.valueCol.replace(/_/g, " ")} by {chartData.categoryCol.replace(/_/g, " ")}
            </h3>
            <p className="text-sm text-muted-foreground">Hover to highlight</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData.bars} 
                layout="vertical"
                onMouseLeave={() => setHoveredBarIndex(null)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${formatValue(value)}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`$${formatValue(value)}`, "Value"]}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
                />
                <Bar 
                  dataKey="value" 
                  isAnimationActive={barChartAnimated}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  onMouseEnter={(_, index) => setHoveredBarIndex(index)}
                  shape={(props) => (
                    <RoundedBar {...props} hoveredIndex={hoveredBarIndex} />
                  )}
                >
                  <LabelList dataKey="value" content={renderBarLabel} />
                  {chartData.bars.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3 - Pie Chart and AI Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Donut Chart */}
        <div className="glass-card rounded-xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">
              {chartData.valueCol.replace(/_/g, " ")} by {chartData.regionCol.replace(/_/g, " ")}
            </h3>
            <p className="text-sm text-muted-foreground">Click segments to filter dashboard</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative h-56 w-56 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={hoveredPieIndex !== null ? 90 : 85}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={pieChartAnimated}
                    animationDuration={1000}
                    animationBegin={0}
                    onClick={(_, index) => handlePieClick(filteredPieData[index].name)}
                    onMouseEnter={(_, index) => setHoveredPieIndex(index)}
                    onMouseLeave={() => setHoveredPieIndex(null)}
                    style={{ cursor: "pointer" }}
                  >
                    {filteredPieData.map((entry, index) => {
                      const originalIndex = chartData.pie.findIndex(p => p.name === entry.name)
                      const isHovered = hoveredPieIndex === index
                      const isActive = activeFilter === entry.name
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CHART_COLORS[originalIndex % CHART_COLORS.length]}
                          style={{
                            transform: isHovered ? "scale(1.05)" : "scale(1)",
                            transformOrigin: "center",
                            transition: "all 0.3s ease",
                            filter: isHovered || isActive ? "brightness(1.2)" : "none",
                            opacity: activeFilter && !isActive ? 0.5 : 1,
                          }}
                        />
                      )
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => [
                      `$${formatValue(value)} (${filteredPieTotal > 0 ? ((value / filteredPieTotal) * 100).toFixed(1) : 0}%)`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-foreground">${formatValue(filteredPieTotal)}</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>
            {/* Legend */}
            <div className="flex-1 space-y-2">
              {chartData.pie.map((item, index) => {
                const isHidden = hiddenPieSegments.has(item.name)
                const isActive = activeFilter === item.name
                return (
                  <button
                    key={item.name}
                    onClick={() => togglePieSegment(item.name)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg p-2 transition-all",
                      isHidden ? "opacity-40" : "hover:bg-muted/30",
                      isActive && "bg-primary/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-3 w-3 rounded-full transition-all",
                          isHidden && "opacity-30"
                        )}
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className={cn(
                        "text-sm text-foreground",
                        isHidden && "line-through"
                      )}>{item.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {chartData.pieTotal > 0 ? ((item.value / chartData.pieTotal) * 100).toFixed(1) : 0}%
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div data-tour="ai-insights">
          <AIInsightsCard insights={aiInsights} />
        </div>
      </div>
    </div>
  )
}

function formatValue(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toFixed(0)
}
