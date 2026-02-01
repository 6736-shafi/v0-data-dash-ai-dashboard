"use client"

import React from "react"
import { useState, useCallback, useRef } from "react"
import { Upload, CloudUpload, ShoppingCart, Users, Target, Sparkles, Moon, Sun, FileSpreadsheet, FileJson, FileText, Check, AlertCircle, RefreshCw, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ParsedData } from "@/app/page"
import { useSoundEffects } from "@/hooks/use-sound-effects"

interface LandingPageProps {
  onDataLoaded: (data: ParsedData) => void
}

const sampleDatasets = [
  {
    name: "Sales Analytics",
    icon: ShoppingCart,
    description: "15K rows - E-commerce data",
    data: generateSalesData(),
  },
  {
    name: "Customer Insights",
    icon: Users,
    description: "8K rows - CRM export",
    data: generateCustomerData(),
  },
  {
    name: "Marketing Metrics",
    icon: Target,
    description: "5K rows - Campaign data",
    data: generateMarketingData(),
  },
]

function generateSalesData(): ParsedData {
  const categories = ["Electronics", "Clothing", "Home & Garden", "Sports", "Books"]
  const regions = ["North", "South", "East", "West", "Central"]
  const rows = Array.from({ length: 500 }, (_, i) => ({
    id: i + 1,
    date: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split("T")[0],
    product: `Product ${Math.floor(Math.random() * 100) + 1}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    region: regions[Math.floor(Math.random() * regions.length)],
    quantity: Math.floor(Math.random() * 50) + 1,
    revenue: Math.floor(Math.random() * 5000) + 100,
    cost: Math.floor(Math.random() * 2000) + 50,
  }))
  return {
    columns: ["id", "date", "product", "category", "region", "quantity", "revenue", "cost"],
    rows,
    fileName: "sales_data.csv",
    rowCount: rows.length,
    columnCount: 8,
  }
}

function generateCustomerData(): ParsedData {
  const segments = ["Enterprise", "SMB", "Startup", "Consumer"]
  const statuses = ["Active", "Churned", "At Risk", "New"]
  const rows = Array.from({ length: 300 }, (_, i) => ({
    customer_id: i + 1,
    name: `Customer ${i + 1}`,
    email: `customer${i + 1}@example.com`,
    segment: segments[Math.floor(Math.random() * segments.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    lifetime_value: Math.floor(Math.random() * 50000) + 1000,
    last_purchase: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split("T")[0],
    total_orders: Math.floor(Math.random() * 100) + 1,
  }))
  return {
    columns: ["customer_id", "name", "email", "segment", "status", "lifetime_value", "last_purchase", "total_orders"],
    rows,
    fileName: "customer_insights.csv",
    rowCount: rows.length,
    columnCount: 8,
  }
}

function generateMarketingData(): ParsedData {
  const channels = ["Email", "Social", "PPC", "Organic", "Referral"]
  const campaigns = ["Summer Sale", "Black Friday", "New Year", "Spring Launch", "Holiday Special"]
  const rows = Array.from({ length: 200 }, (_, i) => ({
    campaign_id: i + 1,
    campaign: campaigns[Math.floor(Math.random() * campaigns.length)],
    channel: channels[Math.floor(Math.random() * channels.length)],
    impressions: Math.floor(Math.random() * 100000) + 5000,
    clicks: Math.floor(Math.random() * 5000) + 100,
    conversions: Math.floor(Math.random() * 500) + 10,
    spend: Math.floor(Math.random() * 10000) + 500,
    roi: (Math.random() * 5 + 0.5).toFixed(2),
  }))
  return {
    columns: ["campaign_id", "campaign", "channel", "impressions", "clicks", "conversions", "spend", "roi"],
    rows,
    fileName: "marketing_metrics.csv",
    rowCount: rows.length,
    columnCount: 8,
  }
}

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error"

export function LandingPage({ onDataLoaded }: LandingPageProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [isDark, setIsDark] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const sounds = useSoundEffects()

  const toggleSound = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    sounds.setEnabled(newValue)
    if (newValue) sounds.playClick()
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (uploadState === "idle" || uploadState === "error") {
      setUploadState("dragging")
    }
  }, [uploadState])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (uploadState === "dragging") {
      setUploadState("idle")
    }
  }, [uploadState])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) {
        await processFile(file)
      } else {
        setUploadState("idle")
      }
    },
    []
  )

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const validExtensions = [".csv", ".xlsx", ".xls", ".json"]
  
  const processFile = async (file: File) => {
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."))
    
    if (!validExtensions.includes(fileExtension)) {
      setUploadState("error")
      setErrorMessage("Invalid file format. Please upload CSV, Excel, or JSON files.")
      sounds.playError()
      return
    }

    setUploadState("uploading")
    setUploadProgress(0)
    setErrorMessage("")

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 15
        })
      }, 200)

      const text = await file.text()
      const lines = text.trim().split("\n")
      
      if (lines.length < 2) {
        clearInterval(progressInterval)
        setUploadState("error")
        setErrorMessage("File appears to be empty or invalid.")
        return
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
        const row: Record<string, string | number> = {}
        headers.forEach((header, i) => {
          const value = values[i] || ""
          const numValue = Number(value)
          row[header] = isNaN(numValue) || value === "" ? value : numValue
        })
        return row
      })

      const parsedData: ParsedData = {
        columns: headers,
        rows,
        fileName: file.name,
        rowCount: rows.length,
        columnCount: headers.length,
      }

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Show success state
      await new Promise((resolve) => setTimeout(resolve, 300))
      setUploadState("success")
      sounds.playSuccess()

      // Auto-transition to dashboard
      await new Promise((resolve) => setTimeout(resolve, 1200))
      sounds.playWhoosh()
      onDataLoaded(parsedData)
    } catch (error) {
      console.error("Error parsing file:", error)
      setUploadState("error")
      setErrorMessage("Failed to parse file. Please check the format and try again.")
    }
  }

  const handleRetry = () => {
    setUploadState("idle")
    setUploadProgress(0)
    setErrorMessage("")
  }

  const handleSampleClick = async (sample: (typeof sampleDatasets)[0]) => {
    sounds.playClick()
    setUploadState("uploading")
    setUploadProgress(0)
    
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 20
      })
    }, 150)

    await new Promise((resolve) => setTimeout(resolve, 800))
    clearInterval(progressInterval)
    setUploadProgress(100)
    
    await new Promise((resolve) => setTimeout(resolve, 300))
    setUploadState("success")
    sounds.playSuccess()
    
    await new Promise((resolve) => setTimeout(resolve, 1200))
    sounds.playWhoosh()
    onDataLoaded(sample.data)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Loading Overlay - now handled by upload zone states */}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-bold text-transparent">
              DataDash
            </span>
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
              AI
            </span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#examples" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Examples
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSound}
              className="rounded-full"
              title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDark(!isDark)}
              className="rounded-full"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
            Turn your data into{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              insights
            </span>{" "}
            in seconds
          </h1>
          <p className="mb-12 text-lg text-muted-foreground md:text-xl text-pretty">
            Drop any CSV or Excel file. Get an AI-powered dashboard instantly.
          </p>

          {/* Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative mx-auto w-full max-w-md rounded-2xl border-2 border-dashed p-8 transition-all duration-300",
              uploadState === "dragging" && "border-primary bg-primary/10 scale-105",
              uploadState === "idle" && "border-primary/50 bg-gradient-to-b from-primary/5 to-transparent hover:border-primary/70",
              uploadState === "uploading" && "border-primary/70 bg-primary/5",
              uploadState === "success" && "border-success bg-success/10",
              uploadState === "error" && "border-destructive bg-destructive/10 animate-shake"
            )}
          >
            {/* Glow Effect */}
            <div className={cn(
              "absolute inset-0 -z-10 rounded-2xl blur-3xl opacity-50",
              uploadState === "success" ? "bg-success/30" : uploadState === "error" ? "bg-destructive/20" : "bg-primary/20 animate-pulse-glow"
            )} />
            
            {/* Pulse ring effect when dragging */}
            {uploadState === "dragging" && (
              <div className="absolute inset-0 rounded-2xl border-2 border-primary animate-pulse-ring" />
            )}

            {/* Orbiting file type icons */}
            {(uploadState === "idle" || uploadState === "dragging") && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-full h-full">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-orbit">
                    <div className="rounded-lg bg-card/80 p-2 shadow-lg border border-border/50">
                      <FileSpreadsheet className="h-5 w-5 text-success" />
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-orbit-reverse">
                    <div className="rounded-lg bg-card/80 p-2 shadow-lg border border-border/50">
                      <FileJson className="h-5 w-5 text-warning" />
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-orbit-slow">
                    <div className="rounded-lg bg-card/80 p-2 shadow-lg border border-border/50">
                      <FileText className="h-5 w-5 text-secondary" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col items-center gap-4 relative z-10">
              {/* Idle State */}
              {(uploadState === "idle" || uploadState === "dragging") && (
                <>
                  <div className="relative">
                    <div className="rounded-2xl bg-primary/10 p-4">
                      <CloudUpload className={cn(
                        "h-12 w-12 text-primary animate-float",
                        uploadState === "dragging" && "text-primary"
                      )} />
                    </div>
                    {/* Floating particles */}
                    <div className="absolute -top-2 -right-2 h-2 w-2 rounded-full bg-primary/60 animate-ping" />
                    <div className="absolute -bottom-1 -left-1 h-1.5 w-1.5 rounded-full bg-secondary/60 animate-ping [animation-delay:0.5s]" />
                  </div>
                  
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">
                      {uploadState === "dragging" ? "Release to upload" : "Drag & drop your file here"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Supports CSV, XLSX, JSON - Max 10MB
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full bg-primary px-6 text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-primary/50 hover:scale-105"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Browse Files
                  </Button>
                </>
              )}

              {/* Uploading State */}
              {uploadState === "uploading" && (
                <>
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="w-full max-w-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Parsing your data...</span>
                      <span className="text-sm font-medium text-primary">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300 progress-shine"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">This won&apos;t take long...</p>
                </>
              )}

              {/* Success State */}
              {uploadState === "success" && (
                <div className="animate-success-scale">
                  <div className="rounded-full bg-success/20 p-4 mb-4">
                    <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" className="text-success/30" />
                      <path d="M9 12l2 2 4-4" className="text-success animate-checkmark" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-success">File uploaded!</p>
                  <p className="text-sm text-muted-foreground mt-1">Launching dashboard...</p>
                </div>
              )}

              {/* Error State */}
              {uploadState === "error" && (
                <>
                  <div className="rounded-full bg-destructive/20 p-4">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                  </div>
                  
                  <div className="text-center">
                    <p className="text-lg font-semibold text-destructive">Invalid file format</p>
                    <p className="mt-1 text-sm text-muted-foreground max-w-[250px]">
                      {errorMessage}
                    </p>
                  </div>

                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="rounded-full border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sample Datasets */}
        <section id="examples" className="mx-auto mt-24 max-w-4xl">
          <div className="mb-8 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Try with sample data</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sampleDatasets.map((sample) => (
              <button
                key={sample.name}
                onClick={() => handleSampleClick(sample)}
                className="glass-card group flex items-center gap-4 rounded-xl p-4 text-left transition-all hover:border-primary/50 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="rounded-lg bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
                  <sample.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{sample.name}</h3>
                  <p className="text-sm text-muted-foreground">{sample.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            {/* Left - Built with v0 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Built with</span>
              <a 
                href="https://v0.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground/10 px-2.5 py-1 font-medium text-foreground transition-colors hover:bg-foreground/20"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 76 65" fill="currentColor">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
                v0
              </a>
            </div>

            {/* Center - Track info */}
            <div className="text-sm text-muted-foreground">
              Made for <span className="font-medium text-foreground">Data & Ops Track</span>
            </div>

            {/* Right - Author */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>by</span>
              <a 
                href="https://www.linkedin.com/in/md-shafiuddin/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Shafi
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
