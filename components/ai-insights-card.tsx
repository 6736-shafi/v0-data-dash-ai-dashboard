"use client"

import { useState, useCallback } from "react"
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Search, RefreshCw, Download, ChevronDown, ChevronUp, Type as type, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type InsightType = "positive" | "warning" | "info" | "recommendation"

export interface Insight {
  id: string
  type: InsightType
  headline: string
  description: string
  confidence: number
  supportingData?: {
    label: string
    value: string
  }[]
}

interface AIInsightsCardProps {
  insights: Insight[]
  isLoading?: boolean
  onRegenerate?: () => void
  onExport?: () => void
}

const insightConfig: Record<InsightType, { 
  borderColor: string
  bgColor: string
  icon: LucideIcon
  iconColor: string
}> = {
  positive: {
    borderColor: "border-l-emerald-500",
    bgColor: "bg-emerald-500/5",
    icon: TrendingUp,
    iconColor: "text-emerald-500",
  },
  warning: {
    borderColor: "border-l-yellow-500",
    bgColor: "bg-yellow-500/5",
    icon: AlertTriangle,
    iconColor: "text-yellow-500",
  },
  info: {
    borderColor: "border-l-blue-500",
    bgColor: "bg-blue-500/5",
    icon: Search,
    iconColor: "text-blue-500",
  },
  recommendation: {
    borderColor: "border-l-purple-500",
    bgColor: "bg-purple-500/5",
    icon: Lightbulb,
    iconColor: "text-purple-500",
  },
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="h-2 w-2 rounded-full bg-primary animate-typing-dot" />
      <div className="h-2 w-2 rounded-full bg-primary animate-typing-dot-delay-1" />
      <div className="h-2 w-2 rounded-full bg-primary animate-typing-dot-delay-2" />
      <span className="ml-2 text-sm text-muted-foreground">Analyzing your data...</span>
    </div>
  )
}

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = insightConfig[insight.type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "rounded-lg border-l-4 p-4 transition-all duration-300 animate-insight-slide-in",
        config.borderColor,
        config.bgColor,
        "hover:shadow-md"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 rounded-md p-1.5", config.bgColor)}>
          <Icon className={cn("h-4 w-4", config.iconColor)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-foreground leading-tight">
              {insight.headline}
            </h4>
            <span className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              insight.confidence >= 90 
                ? "bg-emerald-500/10 text-emerald-400" 
                : insight.confidence >= 70 
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-muted text-muted-foreground"
            )}>
              {insight.confidence}% confidence
            </span>
          </div>
          
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            {insight.description}
          </p>

          {insight.supportingData && insight.supportingData.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Explore
                </>
              )}
            </button>
          )}

          {isExpanded && insight.supportingData && (
            <div className="mt-3 animate-expand-down">
              <div className="rounded-md bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Supporting Data
                </p>
                {insight.supportingData.map((data, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{data.label}</span>
                    <span className="font-medium text-foreground">{data.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function AIInsightsCard({ 
  insights, 
  isLoading = false, 
  onRegenerate,
  onExport 
}: AIInsightsCardProps) {
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true)
    onRegenerate?.()
    // Simulate regeneration delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsRegenerating(false)
  }, [onRegenerate])

  const handleExport = useCallback(() => {
    const exportData = insights.map(i => ({
      headline: i.headline,
      description: i.description,
      type: i.type,
      confidence: `${i.confidence}%`
    }))
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai-insights.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    onExport?.()
  }, [insights, onExport])

  return (
    <div className="glass-card rounded-xl p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Sparkles className="h-5 w-5 text-primary animate-sparkle-rotate" />
            <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
          </div>
          <h3 className="font-semibold text-foreground">AI Insights</h3>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {insights.length} found
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-3">
        {isLoading || isRegenerating ? (
          <>
            <TypingIndicator />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="h-24 rounded-lg bg-muted/20 animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </>
        ) : (
          insights.map((insight, index) => (
            <InsightCard key={insight.id} insight={insight} index={index} />
          ))
        )}
      </div>

      {/* Regenerate Button */}
      <Button
        onClick={handleRegenerate}
        disabled={isRegenerating}
        className="mt-4 w-full bg-primary/10 text-primary hover:bg-primary/20 border-0"
        variant="outline"
      >
        <RefreshCw className={cn(
          "mr-2 h-4 w-4",
          isRegenerating && "animate-spin"
        )} />
        {isRegenerating ? "Regenerating..." : "Regenerate Insights"}
      </Button>
    </div>
  )
}
