"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import {
  ArrowLeft,
  FileSpreadsheet,
  Download,
  Share2,
  Plus,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
  Search,
  Hash,
  Type,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ImageIcon,
  FileText,
  Globe,
  Table2,
  Copy,
  Link2,
  Code2,
  Check,
  HelpCircle,
  Volume2,
  VolumeX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { ExportModal, NotionInstructionsModal, SlackIntegrationModal } from "@/components/export-modal"
import { cn } from "@/lib/utils"
import type { ParsedData } from "@/app/page"
import { DashboardCharts } from "@/components/dashboard-charts"
import { DataTable } from "@/components/data-table"
import { AIChatSidebar } from "@/components/ai-chat-sidebar"
import { KPICard } from "@/components/kpi-card"
import { OnboardingTour, KeyboardShortcutsModal, ShortcutHint, useKeyboardShortcuts, FeatureDiscoveryDot } from "@/components/onboarding-tour"
import { useSoundEffects } from "@/hooks/use-sound-effects"

interface DashboardProps {
  data: ParsedData
  onReset: () => void
}

type TabType = "dashboard" | "raw-data" | "ai-chat"

type ExportModalType = "share-link" | "embed-code" | "pdf-preview" | null

export function Dashboard({ data, onReset }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  const [columnSearch, setColumnSearch] = useState("")
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(data.columns))
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [aiExpanded, setAiExpanded] = useState(true)
  
  // Export state
  const [exportModalType, setExportModalType] = useState<ExportModalType>(null)
  const [showNotionModal, setShowNotionModal] = useState(false)
  const [showSlackModal, setShowSlackModal] = useState(false)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)
  
  // Onboarding and keyboard shortcuts state
  const [showTour, setShowTour] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showShortcutHint, setShowShortcutHint] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const sounds = useSoundEffects()
  const [soundEnabled, setSoundEnabled] = useState(true)

  const toggleSound = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    sounds.setEnabled(newValue)
    if (newValue) sounds.playClick()
  }

  // Check if first visit and show onboarding
  useEffect(() => {
    const hasVisited = localStorage.getItem("datadash-visited")
    if (!hasVisited) {
      setIsFirstVisit(true)
      setShowShortcutHint(true)
      // Start tour after a brief delay
      const timer = setTimeout(() => setShowTour(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleTourComplete = useCallback(() => {
    setShowTour(false)
    localStorage.setItem("datadash-visited", "true")
    sounds.playSuccess()
  }, [sounds])

  const handleTourClose = useCallback(() => {
    setShowTour(false)
    localStorage.setItem("datadash-visited", "true")
  }, [])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => searchInputRef.current?.focus(),
    onExport: () => {
      const exportBtn = document.querySelector("[data-tour='export']") as HTMLButtonElement
      exportBtn?.click()
    },
    onNewFile: () => {
      sounds.playClick()
      onReset()
    },
    onDashboard: () => {
      sounds.playWhoosh()
      setActiveTab("dashboard")
    },
    onTable: () => {
      sounds.playWhoosh()
      setActiveTab("raw-data")
    },
    onChat: () => {
      sounds.playWhoosh()
      setRightSidebarOpen(true)
      setActiveTab("ai-chat")
    },
    onHelp: () => setShowShortcuts(true),
    onEscape: () => {
      setShowShortcuts(false)
      setExportModalType(null)
      setShowNotionModal(false)
      setShowSlackModal(false)
    },
  })

  const toggleColumn = (column: string) => {
    const newSet = new Set(visibleColumns)
    if (newSet.has(column)) {
      newSet.delete(column)
    } else {
      newSet.add(column)
    }
    setVisibleColumns(newSet)
  }

  const getColumnType = (column: string): "number" | "text" | "date" => {
    const sampleValues = data.rows.slice(0, 10).map((row) => row[column])
    const hasNumbers = sampleValues.some((v) => typeof v === "number")
    const hasDatePattern = sampleValues.some(
      (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)
    )
    if (hasDatePattern) return "date"
    if (hasNumbers) return "number"
    return "text"
  }

  const filteredColumns = data.columns.filter((col) =>
    col.toLowerCase().includes(columnSearch.toLowerCase())
  )

  // Generate sparkline data from actual data or random for demo
  const generateSparklineData = (baseValue: number): number[] => {
    const variance = baseValue * 0.1
    return Array.from({ length: 7 }, () => 
      baseValue + (Math.random() - 0.5) * variance
    )
  }

  // Calculate KPI metrics
  const kpiMetrics = useMemo(() => {
    const numericColumns = data.columns.filter((col) => getColumnType(col) === "number")
    
    // Find revenue-like column
    const revenueCol = numericColumns.find((col) =>
      /revenue|sales|amount|total|value/i.test(col)
    ) || numericColumns[0]
    
    // Find count-like column
    const countCol = numericColumns.find((col) =>
      /quantity|count|orders|units/i.test(col)
    ) || numericColumns[1]

    const totalRevenue = revenueCol
      ? data.rows.reduce((sum, row) => sum + (Number(row[revenueCol]) || 0), 0)
      : 0

    const totalCount = countCol
      ? data.rows.reduce((sum, row) => sum + (Number(row[countCol]) || 0), 0)
      : data.rowCount

    const avgValue = revenueCol && data.rowCount > 0
      ? totalRevenue / data.rowCount
      : 0

    // Calculate previous period values (simulated as ~10-15% less for positive trends)
    const prevRevenue = totalRevenue * 0.889 // ~12.5% increase
    const prevRecords = Math.floor(data.rowCount * 0.924) // ~8.2% increase
    const prevCount = Math.floor(totalCount * 0.867) // ~15.3% increase
    const prevAvg = avgValue * 1.033 // ~3.2% decrease

    return [
      {
        label: revenueCol ? `Total ${revenueCol.replace(/_/g, " ")}` : "Total Value",
        value: totalRevenue,
        formattedValue: formatCurrency(totalRevenue),
        trend: "+12.5%",
        trendUp: true,
        icon: DollarSign,
        sparklineData: generateSparklineData(totalRevenue / 7),
        previousValue: prevRevenue,
      },
      {
        label: "Total Records",
        value: data.rowCount,
        formattedValue: formatNumber(data.rowCount),
        trend: "+8.2%",
        trendUp: true,
        icon: Users,
        sparklineData: generateSparklineData(data.rowCount / 7),
        previousValue: prevRecords,
      },
      {
        label: countCol ? `Total ${countCol.replace(/_/g, " ")}` : "Total Count",
        value: totalCount,
        formattedValue: formatNumber(totalCount),
        trend: "+15.3%",
        trendUp: true,
        icon: ShoppingCart,
        sparklineData: generateSparklineData(totalCount / 7),
        previousValue: prevCount,
      },
      {
        label: "Avg per Record",
        value: avgValue,
        formattedValue: formatCurrency(avgValue),
        trend: "-3.2%",
        trendUp: false,
        icon: TrendingUp,
        sparklineData: generateSparklineData(avgValue),
        previousValue: prevAvg,
      },
    ]
  }, [data])

  const aiRecommendations = [
    "Add trend line",
    "Group by region",
    "Compare months",
    "Find outliers",
  ]

  // Export functions
  const handleExportPNG = () => {
    // Simulate PNG export
    const link = document.createElement("a")
    link.download = `${data.fileName.replace(/\.[^/.]+$/, "")}_dashboard.png`
    link.href = "#"
    // In real implementation, use html2canvas
    alert("PNG export would capture the dashboard screenshot")
  }

  const handleExportCSV = () => {
    const headers = data.columns.join(",")
    const rows = data.rows.map(row => 
      data.columns.map(col => {
        const val = row[col]
        return typeof val === "string" && val.includes(",") ? `"${val}"` : val
      }).join(",")
    ).join("\n")
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${data.fileName.replace(/\.[^/.]+$/, "")}_export.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportExcel = () => {
    // Simulate Excel export - in production would use xlsx library
    handleExportCSV() // Fallback to CSV
    alert("Excel export would include formatted charts. CSV downloaded as fallback.")
  }

  const handleExportHTML = () => {
    // Simulate interactive HTML export
    alert("Interactive HTML export would generate a standalone dashboard file")
  }

  const handleCopyToClipboard = () => {
    const text = data.rows.map(row => 
      data.columns.map(col => row[col]).join("\t")
    ).join("\n")
    navigator.clipboard.writeText(`${data.columns.join("\t")}\n${text}`)
    setCopiedToClipboard(true)
    setTimeout(() => setCopiedToClipboard(false), 2000)
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Navigation */}
      <header className="flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onReset} className="rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{data.fileName}</span>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              {formatNumber(data.rowCount)} rows
            </span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              {data.columnCount} columns
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {["dashboard", "raw-data", "ai-chat"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab as TabType)}
              className="hidden sm:inline-flex"
            >
              {tab === "dashboard" && "Dashboard"}
              {tab === "raw-data" && "Raw Data"}
              {tab === "ai-chat" && "AI Chat"}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-transparent" data-tour="export">
                <Download className="mr-2 h-4 w-4" />
                Export
                {isFirstVisit && <FeatureDiscoveryDot show={!showTour} className="ml-1" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Export Dashboard</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleExportPNG}>
                <ImageIcon className="mr-2 h-4 w-4" />
                Download as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExportModalType("pdf-preview")}>
                <FileText className="mr-2 h-4 w-4" />
                Download as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportHTML}>
                <Globe className="mr-2 h-4 w-4" />
                Download as Interactive HTML
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Export Data</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Download filtered CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <Table2 className="mr-2 h-4 w-4" />
                Download Excel with charts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyToClipboard}>
                {copiedToClipboard ? (
                  <Check className="mr-2 h-4 w-4 text-success" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copiedToClipboard ? "Copied!" : "Copy to clipboard"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Share Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex bg-transparent">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Share Options</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setExportModalType("share-link")}>
                <Link2 className="mr-2 h-4 w-4" />
                Generate shareable link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExportModalType("embed-code")}>
                <Code2 className="mr-2 h-4 w-4" />
                Embed code for websites
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowNotionModal(true)}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
                </svg>
                Share to Notion
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSlackModal(true)}>
                <Hash className="mr-2 h-4 w-4" />
                Share to Slack
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={onReset} className="bg-transparent">
            <Plus className="mr-2 h-4 w-4" />
            New File
          </Button>

          {/* Utility buttons */}
          <div className="hidden items-center gap-1 border-l border-border/50 pl-2 sm:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSound}
              className="h-8 w-8"
              title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowShortcuts(true)}
              className="h-8 w-8"
              title="Keyboard shortcuts (?)"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={cn(
            "flex flex-col border-r border-border/50 bg-card/50 transition-all duration-300",
            leftSidebarOpen ? "w-72" : "w-0"
          )}
        >
          {leftSidebarOpen && (
            <div className="flex h-full flex-col overflow-hidden">
              {/* Columns Section */}
              <div className="flex-1 overflow-auto p-4">
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Data Columns</h3>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search columns... (/)"
                      value={columnSearch}
                      onChange={(e) => setColumnSearch(e.target.value)}
                      className="pl-9 h-9 bg-muted/50"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  {filteredColumns.map((column) => {
                    const colType = getColumnType(column)
                    return (
                      <label
                        key={column}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(column)}
                          onChange={() => toggleColumn(column)}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                        <div
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded text-xs font-medium",
                            colType === "number" && "bg-secondary/20 text-secondary",
                            colType === "text" && "bg-success/20 text-success",
                            colType === "date" && "bg-warning/20 text-warning"
                          )}
                        >
                          {colType === "number" && <Hash className="h-3 w-3" />}
                          {colType === "text" && <Type className="h-3 w-3" />}
                          {colType === "date" && <Calendar className="h-3 w-3" />}
                        </div>
                        <span className="flex-1 truncate text-sm">{column}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="border-t border-border/50 p-4">
                <button
                  onClick={() => setAiExpanded(!aiExpanded)}
                  className="flex w-full items-center justify-between text-sm font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Recommendations
                  </span>
                  {aiExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {aiExpanded && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {aiRecommendations.map((rec) => (
                      <button
                        key={rec}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        {rec}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="border-t border-border/50 p-4">
                <button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className="flex w-full items-center justify-between text-sm font-semibold"
                >
                  <span>Filters</span>
                  {filtersExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {filtersExpanded && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Date Range
                      </label>
                      <Input type="date" className="h-8 bg-muted/50" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="flex h-full w-6 items-center justify-center border-r border-border/50 bg-card/30 transition-colors hover:bg-muted/50"
        >
          {leftSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
          ) : (
            <PanelLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Main Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-tour="kpi-cards">
                {kpiMetrics.map((kpi, index) => (
                  <KPICard
                    key={kpi.label}
                    label={kpi.label}
                    value={kpi.value}
                    formattedValue={kpi.formattedValue}
                    trend={kpi.trend}
                    trendUp={kpi.trendUp}
                    icon={kpi.icon}
                    sparklineData={kpi.sparklineData}
                    previousValue={kpi.previousValue}
                    gradientIndex={index}
                  />
                ))}
              </div>

              {/* Charts */}
              <div data-tour="charts">
                <DashboardCharts data={data} />
              </div>
            </div>
          )}

          {activeTab === "raw-data" && (
            <DataTable data={data} visibleColumns={visibleColumns} />
          )}

          {activeTab === "ai-chat" && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">AI Chat</h3>
                <p className="mt-2 text-muted-foreground">
                  Open the AI sidebar to chat about your data
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setRightSidebarOpen(true)}
                >
                  Open AI Chat
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar Toggle */}
        <button
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          className="flex h-full w-6 items-center justify-center border-l border-border/50 bg-card/30 transition-colors hover:bg-muted/50"
        >
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Right Sidebar - AI Chat */}
        <div data-tour="ai-chat">
          <AIChatSidebar
            isOpen={rightSidebarOpen}
            onClose={() => setRightSidebarOpen(false)}
            data={data}
          />
        </div>
      </div>

      {/* Export Modals */}
      <ExportModal
        isOpen={exportModalType !== null}
        onClose={() => setExportModalType(null)}
        data={data}
        mode={exportModalType}
      />
      
      {showNotionModal && (
        <NotionInstructionsModal onClose={() => setShowNotionModal(false)} />
      )}
      
      {showSlackModal && (
        <SlackIntegrationModal 
          onClose={() => setShowSlackModal(false)} 
          data={data}
        />
      )}

      {/* Onboarding */}
      <OnboardingTour
        isOpen={showTour}
        onClose={handleTourClose}
        onComplete={handleTourComplete}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      <ShortcutHint
        show={showShortcutHint && !showTour}
        onDismiss={() => setShowShortcutHint(false)}
      />
    </div>
  )
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  }
  return `$${value.toFixed(0)}`
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString()
}
