"use client"

import { useState, useEffect, useRef } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface KPICardProps {
  label: string
  value: number
  formattedValue: string
  trend: string
  trendUp: boolean
  icon: LucideIcon
  sparklineData: number[]
  previousValue: number
  gradientIndex: number
}

const gradients = [
  "from-purple-500/20 via-purple-700/15 to-purple-900/10",
  "from-blue-500/20 via-blue-700/15 to-blue-900/10",
  "from-emerald-500/20 via-emerald-700/15 to-emerald-900/10",
  "from-orange-500/20 via-orange-700/15 to-orange-900/10",
]

const accentColors = [
  "purple-500",
  "blue-500",
  "emerald-500",
  "orange-500",
]

const shimmerDelays = [
  "animate-shimmer",
  "animate-shimmer-delay-1",
  "animate-shimmer-delay-2",
  "animate-shimmer-delay-3",
]

function useCountUp(end: number, duration: number = 1500) {
  const [count, setCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const countRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    setIsComplete(false)
    countRef.current = 0
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)
      
      // Easing function for smooth deceleration
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentCount = Math.floor(easeOutQuart * end)
      
      if (currentCount !== countRef.current) {
        countRef.current = currentCount
        setCount(currentCount)
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(end)
        setIsComplete(true)
      }
    }

    requestAnimationFrame(animate)
  }, [end, duration])

  return { count, isComplete }
}

function formatValue(value: number, isCurrency: boolean): string {
  if (isCurrency) {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return `$${value.toFixed(0)}`
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString()
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const height = 24
  const width = 80
  const padding = 2

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((value - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(" ")

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Area fill */}
      <polygon
        points={areaPoints}
        className={cn(
          "fill-current opacity-20",
          color === "purple-500" && "text-purple-500",
          color === "blue-500" && "text-blue-500",
          color === "emerald-500" && "text-emerald-500",
          color === "orange-500" && "text-orange-500"
        )}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          "stroke-current",
          color === "purple-500" && "text-purple-500",
          color === "blue-500" && "text-blue-500",
          color === "emerald-500" && "text-emerald-500",
          color === "orange-500" && "text-orange-500"
        )}
      />
      {/* End dot */}
      <circle
        cx={width - padding}
        cy={height - padding - ((data[data.length - 1] - min) / range) * (height - padding * 2)}
        r="3"
        className={cn(
          "fill-current",
          color === "purple-500" && "text-purple-500",
          color === "blue-500" && "text-blue-500",
          color === "emerald-500" && "text-emerald-500",
          color === "orange-500" && "text-orange-500"
        )}
      />
    </svg>
  )
}

export function KPICard({
  label,
  value,
  formattedValue,
  trend,
  trendUp,
  icon: Icon,
  sparklineData,
  previousValue,
  gradientIndex,
}: KPICardProps) {
  const isCurrency = formattedValue.startsWith("$")
  const { count, isComplete } = useCountUp(value, 1500)
  const displayValue = isComplete ? formattedValue : formatValue(count, isCurrency)
  
  const difference = value - previousValue
  const formattedDifference = isCurrency 
    ? `${difference >= 0 ? "+" : ""}$${Math.abs(difference).toLocaleString()}`
    : `${difference >= 0 ? "+" : ""}${Math.abs(difference).toLocaleString()}`

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "glass-card group relative overflow-hidden rounded-xl p-5 transition-all hover:scale-[1.02] hover:shadow-lg cursor-default",
              `bg-gradient-to-br ${gradients[gradientIndex]}`
            )}
          >
            {/* Shimmer effect */}
            <div className={cn(
              "absolute inset-0 -translate-x-full",
              shimmerDelays[gradientIndex]
            )}>
              <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
            </div>

            <div className="flex items-start justify-between relative z-10">
              <div className={cn(
                "rounded-lg p-2",
                gradientIndex === 0 && "bg-purple-500/20",
                gradientIndex === 1 && "bg-blue-500/20",
                gradientIndex === 2 && "bg-emerald-500/20",
                gradientIndex === 3 && "bg-orange-500/20"
              )}>
                <Icon className={cn(
                  "h-5 w-5",
                  gradientIndex === 0 && "text-purple-400",
                  gradientIndex === 1 && "text-blue-400",
                  gradientIndex === 2 && "text-emerald-400",
                  gradientIndex === 3 && "text-orange-400"
                )} />
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  trendUp
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                )}
              >
                {trend}
              </span>
            </div>
            
            <div className="mt-4 relative z-10">
              <p className="text-3xl font-bold text-foreground tabular-nums">
                {displayValue}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>

            {/* Mini Sparkline */}
            <div className="mt-3 relative z-10">
              <MiniSparkline data={sparklineData} color={accentColors[gradientIndex]} />
            </div>

            {/* Inner glow on hover */}
            <div className="absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-100">
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br to-transparent",
                gradientIndex === 0 && "from-purple-500/10",
                gradientIndex === 1 && "from-blue-500/10",
                gradientIndex === 2 && "from-emerald-500/10",
                gradientIndex === 3 && "from-orange-500/10"
              )} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-card border-border">
          <p className="text-sm">
            vs. previous period: <span className={trendUp ? "text-emerald-400" : "text-red-400"}>{formattedDifference}</span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
