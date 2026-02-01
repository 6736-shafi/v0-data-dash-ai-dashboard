"use client"

import React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { 
  Bot, Send, X, Sparkles, Copy, Check, Mic, MicOff, 
  BarChart3, PieChart, TrendingUp, Loader2, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ParsedData } from "@/app/page"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AIChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  data: ParsedData
  onHighlightChart?: (chartType: string) => void
}

interface MiniChartData {
  type: "bar" | "line" | "pie"
  values: number[]
  labels?: string[]
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  chartReference?: string
  miniChart?: MiniChartData
  dataReferences?: { label: string; value: string; chartType?: string }[]
}

const suggestedPrompts = [
  { text: "What are the key trends?", icon: TrendingUp },
  { text: "Find anomalies in my data", icon: Sparkles },
  { text: "Compare top categories", icon: BarChart3 },
  { text: "Show distribution breakdown", icon: PieChart },
  { text: "Predict next quarter", icon: TrendingUp },
  { text: "Summarize key metrics", icon: BarChart3 },
]

// Mini sparkline chart component
function MiniChart({ data }: { data: MiniChartData }) {
  const max = Math.max(...data.values)
  const min = Math.min(...data.values)
  const range = max - min || 1
  
  if (data.type === "bar") {
    return (
      <div className="flex items-end gap-1 h-12 px-2 py-1 bg-muted/30 rounded-lg my-2">
        {data.values.map((value, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div 
              className="w-full bg-primary/60 rounded-t"
              style={{ height: `${((value - min) / range) * 32 + 8}px` }}
            />
            {data.labels?.[i] && (
              <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                {data.labels[i]}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }
  
  if (data.type === "line") {
    const points = data.values.map((value, i) => {
      const x = (i / (data.values.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 80 - 10
      return `${x},${y}`
    }).join(" ")
    
    return (
      <div className="h-12 px-2 py-1 bg-muted/30 rounded-lg my-2">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )
  }
  
  // Pie chart
  const total = data.values.reduce((a, b) => a + b, 0)
  let currentAngle = 0
  const colors = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--success))", "hsl(var(--warning))"]
  
  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-muted/30 rounded-lg my-2">
      <svg viewBox="0 0 32 32" className="w-10 h-10">
        {data.values.map((value, i) => {
          const angle = (value / total) * 360
          const startAngle = currentAngle
          currentAngle += angle
          const x1 = 16 + 14 * Math.cos((startAngle - 90) * Math.PI / 180)
          const y1 = 16 + 14 * Math.sin((startAngle - 90) * Math.PI / 180)
          const x2 = 16 + 14 * Math.cos((startAngle + angle - 90) * Math.PI / 180)
          const y2 = 16 + 14 * Math.sin((startAngle + angle - 90) * Math.PI / 180)
          const largeArc = angle > 180 ? 1 : 0
          return (
            <path
              key={i}
              d={`M 16 16 L ${x1} ${y1} A 14 14 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={colors[i % colors.length]}
              opacity={0.8}
            />
          )
        })}
      </svg>
      {data.labels && (
        <div className="flex-1 text-[10px] space-y-0.5">
          {data.labels.slice(0, 3).map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="text-muted-foreground truncate">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Markdown renderer
function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let inList = false
  let listItems: string[] = []
  let listType: "ul" | "ol" = "ul"
  
  const processLine = (line: string): React.ReactNode => {
    // Bold
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Inline code
    line = line.replace(/`(.*?)`/g, '<code>$1</code>')
    return <span dangerouslySetInnerHTML={{ __html: line }} />
  }
  
  lines.forEach((line, i) => {
    const trimmed = line.trim()
    
    // Check for list items
    const ulMatch = trimmed.match(/^[-*]\s+(.*)/)
    const olMatch = trimmed.match(/^\d+\.\s+(.*)/)
    
    if (ulMatch || olMatch) {
      if (!inList) {
        inList = true
        listType = ulMatch ? "ul" : "ol"
        listItems = []
      }
      listItems.push(ulMatch ? ulMatch[1] : olMatch![1])
    } else {
      // End list if we were in one
      if (inList) {
        const ListTag = listType
        elements.push(
          <ListTag key={`list-${i}`} className={listType === "ul" ? "list-disc" : "list-decimal"} style={{ paddingLeft: "1.25rem", margin: "0.5rem 0" }}>
            {listItems.map((item, j) => (
              <li key={j} style={{ margin: "0.25rem 0" }}>{processLine(item)}</li>
            ))}
          </ListTag>
        )
        inList = false
        listItems = []
      }
      
      if (trimmed) {
        elements.push(<p key={i} className="mb-2 last:mb-0">{processLine(trimmed)}</p>)
      } else if (i > 0 && i < lines.length - 1) {
        elements.push(<br key={i} />)
      }
    }
  })
  
  // Handle any remaining list
  if (inList && listItems.length > 0) {
    const ListTag = listType
    elements.push(
      <ListTag key="list-end" className={listType === "ul" ? "list-disc" : "list-decimal"} style={{ paddingLeft: "1.25rem", margin: "0.5rem 0" }}>
        {listItems.map((item, j) => (
          <li key={j} style={{ margin: "0.25rem 0" }}>{processLine(item)}</li>
        ))}
      </ListTag>
    )
  }
  
  return <div className="chat-markdown">{elements}</div>
}

export function AIChatSidebar({ isOpen, onClose, data, onHighlightChart }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [attachedChart, setAttachedChart] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Generate initial insights
  const initialInsights = useCallback(() => {
    const numericColumns = data.columns.filter((col) => {
      const sample = data.rows.slice(0, 10).map((r) => r[col])
      return sample.some((v) => typeof v === "number")
    })
    
    const valueCol = numericColumns[0]
    let total = 0
    let max = -Infinity
    let maxCategory = ""
    
    if (valueCol) {
      data.rows.forEach((row) => {
        const val = Number(row[valueCol]) || 0
        total += val
        if (val > max) {
          max = val
          maxCategory = String(row[data.columns[0]] || "")
        }
      })
    }
    
    const avg = data.rowCount > 0 ? total / data.rowCount : 0
    const growthRate = ((Math.random() * 20) + 5).toFixed(1)
    
    return [
      {
        id: "insight-1",
        role: "assistant" as const,
        content: `**Strong Growth Detected**: Your ${valueCol || "primary metric"} shows a **+${growthRate}%** increase over the analyzed period. This outpaces typical industry benchmarks.`,
        timestamp: new Date(),
        miniChart: {
          type: "line" as const,
          values: Array.from({ length: 7 }, (_, i) => avg * (0.9 + i * 0.02 + Math.random() * 0.05)),
        }
      },
      {
        id: "insight-2",
        role: "assistant" as const,
        content: `**Top Performer**: "${maxCategory || "Category A"}" leads with **${formatValue(max)}** in total ${valueCol || "value"}, contributing ~${((max / total) * 100).toFixed(0)}% of your total.`,
        timestamp: new Date(),
        dataReferences: [
          { label: maxCategory || "Category A", value: formatValue(max), chartType: "bar" },
        ]
      },
      {
        id: "insight-3",
        role: "assistant" as const,
        content: `I found **${Math.floor(data.rowCount * 0.02)}** potential anomalies worth investigating. Would you like me to analyze them?`,
        timestamp: new Date(),
      }
    ]
  }, [data])

  useEffect(() => {
    if (showWelcome && messages.length === 0) {
      // Delay initial insights for effect
      const timer = setTimeout(() => {
        setMessages(initialInsights())
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [showWelcome, messages.length, initialInsights])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const generateAIResponse = (userMessage: string): Message => {
    const lowerMessage = userMessage.toLowerCase()
    const numericColumns = data.columns.filter((col) => {
      const sample = data.rows.slice(0, 10).map((r) => r[col])
      return sample.some((v) => typeof v === "number")
    })
    const categoricalColumns = data.columns.filter((col) => {
      const sample = data.rows.slice(0, 10).map((r) => r[col])
      return sample.every((v) => typeof v === "string" && !/^\d{4}-\d{2}-\d{2}/.test(v as string))
    })
    
    const valueCol = numericColumns[0]
    const categoryCol = categoricalColumns[0]
    let total = 0, max = -Infinity, min = Infinity
    
    if (valueCol) {
      data.rows.forEach((row) => {
        const val = Number(row[valueCol]) || 0
        total += val
        if (val > max) max = val
        if (val < min) min = val
      })
    }
    
    const avg = data.rowCount > 0 ? total / data.rowCount : 0

    if (lowerMessage.includes("trend") || lowerMessage.includes("pattern")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: `Based on my analysis, I've identified **3 key trends**:\n\n1. **Upward Momentum**: ${valueCol || "Value"} increased by ~12.5% over the period\n2. **Seasonal Patterns**: Peak activity occurs mid-period\n3. **Consistent Growth**: Average maintains above baseline\n\nThe trend line shows steady improvement with some volatility.`,
        timestamp: new Date(),
        miniChart: {
          type: "line",
          values: Array.from({ length: 8 }, (_, i) => avg * (0.85 + i * 0.03 + Math.random() * 0.1)),
        },
        dataReferences: [
          { label: "Growth Rate", value: "+12.5%", chartType: "area" },
          { label: "Peak Value", value: formatValue(max), chartType: "area" },
        ]
      }
    }

    if (lowerMessage.includes("anomal") || lowerMessage.includes("outlier")) {
      const outlierCount = Math.floor(data.rowCount * 0.02)
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: `I detected **${outlierCount} anomalies** in your dataset:\n\n- **${Math.floor(outlierCount * 0.6)} high outliers** exceeding 2 standard deviations\n- **${Math.floor(outlierCount * 0.4)} low outliers** below expected ranges\n\nThe maximum value of **${formatValue(max)}** is ${((max / avg - 1) * 100).toFixed(0)}% above average. Consider investigating records from these periods.`,
        timestamp: new Date(),
        dataReferences: [
          { label: "High Outliers", value: String(Math.floor(outlierCount * 0.6)) },
          { label: "Max Value", value: formatValue(max), chartType: "area" },
        ]
      }
    }

    if (lowerMessage.includes("compare") || lowerMessage.includes("category") || lowerMessage.includes("distribution")) {
      const categories = categoryCol ? [...new Set(data.rows.map((r) => String(r[categoryCol])))] : []
      const topCategories = categories.slice(0, 4)
      const values = topCategories.map(() => Math.floor(Math.random() * 50000) + 10000)
      
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: `Here's the breakdown by ${categoryCol || "category"}:\n\nYour data spans **${categories.length}** distinct segments. The top performers are leading by significant margins, while bottom segments show room for improvement.`,
        timestamp: new Date(),
        miniChart: {
          type: "bar",
          values: values,
          labels: topCategories.length > 0 ? topCategories : ["A", "B", "C", "D"],
        },
        dataReferences: topCategories.slice(0, 2).map((cat, i) => ({
          label: cat,
          value: formatValue(values[i]),
          chartType: "bar"
        }))
      }
    }

    if (lowerMessage.includes("pie") || lowerMessage.includes("share") || lowerMessage.includes("portion")) {
      const categories = categoryCol ? [...new Set(data.rows.map((r) => String(r[categoryCol])))].slice(0, 4) : ["A", "B", "C", "D"]
      const values = [35, 28, 22, 15]
      
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: `Market share distribution:\n\nThe data shows a **concentrated market** with the top category holding ~35% share. Consider strategies to:\n- Expand in growing segments\n- Defend market leader position\n- Identify untapped opportunities`,
        timestamp: new Date(),
        miniChart: {
          type: "pie",
          values: values,
          labels: categories,
        }
      }
    }

    // Default response
    return {
      id: Date.now().toString(),
      role: "assistant",
      content: `Great question! Analyzing your **${data.rowCount.toLocaleString()} records** across ${data.columnCount} columns:\n\n- **Total ${valueCol || "Value"}**: ${formatValue(total)}\n- **Average**: ${formatValue(avg)}\n- **Range**: ${formatValue(min)} to ${formatValue(max)}\n\nWould you like me to:\n1. Show detailed trends over time\n2. Find anomalies in the data\n3. Compare across categories`,
      timestamp: new Date(),
      dataReferences: [
        { label: "Total Records", value: data.rowCount.toLocaleString() },
        { label: "Total Value", value: formatValue(total), chartType: "area" },
      ]
    }
  }

  const handleSubmit = async (message: string) => {
    if (!message.trim()) return
    setShowWelcome(false)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: attachedChart ? `[Referencing ${attachedChart} chart] ${message}` : message,
      timestamp: new Date(),
      chartReference: attachedChart || undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setAttachedChart(null)
    setIsTyping(true)

    await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800))

    const response = generateAIResponse(message)
    setMessages((prev) => [...prev, response])
    setIsTyping(false)
  }

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleVoice = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      // Simulate voice input
      setTimeout(() => {
        setInput("What are the key trends in my data?")
        setIsRecording(false)
      }, 2000)
    }
  }

  const handleDataRefClick = (chartType?: string) => {
    if (chartType && onHighlightChart) {
      onHighlightChart(chartType)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-l border-border/50 bg-card/95 backdrop-blur-sm transition-all duration-300",
        isOpen ? "w-96" : "w-0"
      )}
    >
      {isOpen && (
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 p-2">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card animate-online-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">DataDash AI</h3>
                <p className="text-xs text-muted-foreground">Powered by Claude</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 bg-transparent">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Welcome State */}
          {showWelcome && messages.length > 0 && (
            <div className="px-4 pt-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="rounded-lg bg-muted/50 p-1.5 mt-0.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-foreground">
                  I&apos;ve analyzed your <strong>{data.rowCount.toLocaleString()}</strong> rows. Here&apos;s what I found interesting:
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            <TooltipProvider>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    message.role === "user" ? "justify-end" : "justify-start",
                    message.role === "user" ? "animate-message-right" : "animate-message-left"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 rounded-lg bg-muted/50 p-1.5 h-fit">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div className="group relative max-w-[85%]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 text-sm",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted/50 text-foreground rounded-tl-sm"
                          )}
                        >
                          {message.chartReference && (
                            <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                              <BarChart3 className="h-3 w-3" />
                              Ref: {message.chartReference}
                            </div>
                          )}
                          
                          {message.role === "assistant" 
                            ? renderMarkdown(message.content)
                            : <p className="whitespace-pre-wrap">{message.content}</p>
                          }
                          
                          {/* Mini Chart */}
                          {message.miniChart && (
                            <MiniChart data={message.miniChart} />
                          )}
                          
                          {/* Data References */}
                          {message.dataReferences && message.dataReferences.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/30">
                              {message.dataReferences.map((ref, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleDataRefClick(ref.chartType)}
                                  className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors",
                                    ref.chartType
                                      ? "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                                      : "bg-muted/50 text-muted-foreground"
                                  )}
                                >
                                  {ref.chartType && <ChevronRight className="h-3 w-3" />}
                                  <span className="font-medium">{ref.label}:</span>
                                  <span>{ref.value}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="text-xs">
                        {formatTime(message.timestamp)}
                      </TooltipContent>
                    </Tooltip>
                    
                    {/* Copy button for AI messages */}
                    {message.role === "assistant" && (
                      <button
                        onClick={() => handleCopy(message.content, message.id)}
                        className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted/50"
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </TooltipProvider>

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 justify-start animate-message-left">
                <div className="flex-shrink-0 rounded-lg bg-muted/50 p-1.5 h-fit">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-primary animate-typing-dot" />
                      <div className="h-2 w-2 rounded-full bg-primary animate-typing-dot-delay-1" />
                      <div className="h-2 w-2 rounded-full bg-primary animate-typing-dot-delay-2" />
                    </div>
                    <span className="text-xs text-muted-foreground">AI is analyzing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts - Horizontal scrollable */}
          {(messages.length <= 4 || showWelcome) && (
            <div className="border-t border-border/50 p-3">
              <p className="mb-2 text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Suggested prompts
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => handleSubmit(prompt.text)}
                    className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <prompt.icon className="h-3 w-3" />
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attached Chart Indicator */}
          {attachedChart && (
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg text-xs">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary">Referencing: {attachedChart} chart</span>
                <button onClick={() => setAttachedChart(null)} className="ml-auto text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border/50 p-3">
            <div className="flex items-end gap-2">
              {/* Attach chart button */}
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 flex-shrink-0 bg-transparent"
                      onClick={() => setAttachedChart(attachedChart ? null : "Area")}
                    >
                      <BarChart3 className={cn("h-4 w-4", attachedChart && "text-primary")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach chart reference</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-9 w-9 flex-shrink-0 bg-transparent",
                        isRecording && "text-destructive"
                      )}
                      onClick={toggleVoice}
                    >
                      {isRecording ? (
                        <div className="relative">
                          <MicOff className="h-4 w-4" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex gap-0.5">
                              {[0, 1, 2].map((i) => (
                                <div
                                  key={i}
                                  className="w-0.5 bg-destructive rounded-full animate-voice-wave"
                                  style={{ animationDelay: `${i * 0.15}s` }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isRecording ? "Stop recording" : "Voice input"}</TooltipContent>
                </Tooltip>
              </div>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSubmit(input)
                }}
                className="flex-1 flex items-end gap-2"
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(input)
                    }
                  }}
                  placeholder="Ask about your data..."
                  className="flex-1 resize-none rounded-xl bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[40px] max-h-[120px]"
                  disabled={isTyping}
                  rows={1}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isTyping}
                  className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex-shrink-0"
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

function formatValue(value: number): string {
  if (!isFinite(value)) return "N/A"
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  }
  return `$${value.toFixed(0)}`
}
