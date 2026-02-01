"use client"

import { useState } from "react"
import {
  ImageIcon,
  FileText,
  Globe,
  FileSpreadsheet,
  Table2,
  Copy,
  Link2,
  Code2,
  MessageSquare,
  Hash,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Building2,
  Sparkles,
  Database,
  FileDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { ParsedData } from "@/app/page"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  data: ParsedData
  mode: "share-link" | "embed-code" | "pdf-preview" | null
}

// Share Link Modal
function ShareLinkModal({ onClose, data }: { onClose: () => void; data: ParsedData }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `https://datadash.ai/share/${btoa(data.fileName).slice(0, 12)}?v=${Date.now()}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Share Dashboard
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Anyone with this link can view your dashboard. The link expires in 7 days.
          </p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={shareUrl}
              className="bg-muted/50 font-mono text-sm"
            />
            <Button onClick={handleCopy} variant="outline" className="shrink-0 bg-transparent">
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{data.fileName}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {data.rowCount.toLocaleString()} rows
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Embed Code Modal
function EmbedCodeModal({ onClose, data }: { onClose: () => void; data: ParsedData }) {
  const [copied, setCopied] = useState(false)
  const embedId = btoa(data.fileName).slice(0, 12)
  const embedCode = `<iframe
  src="https://datadash.ai/embed/${embedId}"
  width="100%"
  height="600"
  frameborder="0"
  allowfullscreen
></iframe>`

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            Embed Dashboard
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Copy this code to embed the dashboard on any website.
          </p>
          <div className="relative">
            <pre className="rounded-lg bg-muted/50 p-4 text-xs font-mono overflow-x-auto">
              {embedCode}
            </pre>
            <Button
              onClick={handleCopy}
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground mb-2">Preview:</p>
            <div className="aspect-video rounded bg-background/50 border border-border/50 flex items-center justify-center">
              <div className="text-center">
                <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// PDF Preview Modal
function PDFPreviewModal({ onClose, data }: { onClose: () => void; data: ParsedData }) {
  const [reportTitle, setReportTitle] = useState(`${data.fileName.replace(/\.[^/.]+$/, "")} Report`)
  const [includeInsights, setIncludeInsights] = useState(true)
  const [includeRawData, setIncludeRawData] = useState(false)
  const [includeCharts, setIncludeCharts] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewExpanded, setPreviewExpanded] = useState(true)

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      // Simulate download
      const link = document.createElement("a")
      link.href = "#"
      link.download = `${reportTitle}.pdf`
      onClose()
    }, 2000)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Export PDF Report
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Options */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Report Title</label>
              <Input
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium block">Include Sections</label>
              
              <label className="flex items-center gap-3 rounded-lg border border-border/50 p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Charts & Visualizations</p>
                  <p className="text-xs text-muted-foreground">Include all dashboard charts</p>
                </div>
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </label>

              <label className="flex items-center gap-3 rounded-lg border border-border/50 p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={includeInsights}
                  onChange={(e) => setIncludeInsights(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">AI Insights</p>
                  <p className="text-xs text-muted-foreground">Include generated insights</p>
                </div>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </label>

              <label className="flex items-center gap-3 rounded-lg border border-border/50 p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={includeRawData}
                  onChange={(e) => setIncludeRawData(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Raw Data Table</p>
                  <p className="text-xs text-muted-foreground">Append data as table (max 100 rows)</p>
                </div>
                <Database className="h-4 w-4 text-muted-foreground" />
              </label>
            </div>

            <Button 
              onClick={handleGenerate} 
              className="w-full"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <button
              onClick={() => setPreviewExpanded(!previewExpanded)}
              className="flex items-center justify-between w-full text-sm font-medium"
            >
              <span>Report Preview</span>
              {previewExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {previewExpanded && (
              <div className="rounded-lg border border-border bg-white text-gray-900 overflow-hidden shadow-lg">
                {/* PDF Page Preview */}
                <div className="p-6 space-y-4 text-sm" style={{ aspectRatio: "8.5/11", maxHeight: "400px", overflowY: "auto" }}>
                  {/* Header with logo placeholder */}
                  <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Company Logo</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Generated on</p>
                      <p className="text-xs font-medium">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center py-4">
                    <h1 className="text-xl font-bold text-gray-900">{reportTitle}</h1>
                    <p className="text-xs text-gray-500 mt-1">
                      Data Analysis Report | {data.rowCount.toLocaleString()} records analyzed
                    </p>
                  </div>

                  {/* KPI Summary */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Total Records</p>
                      <p className="text-lg font-bold">{data.rowCount.toLocaleString()}</p>
                    </div>
                    <div className="rounded bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Columns</p>
                      <p className="text-lg font-bold">{data.columnCount}</p>
                    </div>
                  </div>

                  {includeCharts && (
                    <>
                      {/* Page break indicator */}
                      <div className="border-t-2 border-dashed border-gray-300 my-4 pt-2">
                        <p className="text-xs text-gray-400 text-center">Charts Section</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-20 rounded bg-gray-100 flex items-center justify-center">
                          <p className="text-xs text-gray-400">Area Chart Preview</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="h-16 rounded bg-gray-100 flex items-center justify-center">
                            <p className="text-xs text-gray-400">Bar Chart</p>
                          </div>
                          <div className="h-16 rounded bg-gray-100 flex items-center justify-center">
                            <p className="text-xs text-gray-400">Donut Chart</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {includeInsights && (
                    <>
                      <div className="border-t-2 border-dashed border-gray-300 my-4 pt-2">
                        <p className="text-xs text-gray-400 text-center">AI Insights Section</p>
                      </div>
                      <div className="space-y-2">
                        <div className="rounded border-l-4 border-green-500 bg-green-50 p-2">
                          <p className="text-xs font-medium">Revenue Spike Detected</p>
                          <p className="text-xs text-gray-600">Growth of 12.5% over period...</p>
                        </div>
                        <div className="rounded border-l-4 border-yellow-500 bg-yellow-50 p-2">
                          <p className="text-xs font-medium">Attention Needed</p>
                          <p className="text-xs text-gray-600">Some segments underperforming...</p>
                        </div>
                      </div>
                    </>
                  )}

                  {includeRawData && (
                    <>
                      <div className="border-t-2 border-dashed border-gray-300 my-4 pt-2">
                        <p className="text-xs text-gray-400 text-center">Data Table Section</p>
                      </div>
                      <div className="overflow-hidden rounded border border-gray-200">
                        <div className="grid grid-cols-3 bg-gray-100 text-xs font-medium">
                          {data.columns.slice(0, 3).map((col) => (
                            <div key={col} className="px-2 py-1 truncate border-r border-gray-200 last:border-r-0">
                              {col}
                            </div>
                          ))}
                        </div>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="grid grid-cols-3 text-xs border-t border-gray-200">
                            <div className="px-2 py-1 bg-gray-50 border-r border-gray-200">...</div>
                            <div className="px-2 py-1 bg-gray-50 border-r border-gray-200">...</div>
                            <div className="px-2 py-1 bg-gray-50">...</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Footer */}
                  <div className="border-t border-gray-200 pt-4 mt-4 flex items-center justify-between text-xs text-gray-400">
                    <span>Generated by DataDash AI</span>
                    <span>Page 1 of {1 + (includeCharts ? 1 : 0) + (includeInsights ? 1 : 0) + (includeRawData ? 1 : 0)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Notion Instructions Modal
function NotionInstructionsModal({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
            </svg>
            Share to Notion
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/30 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Export as PDF or PNG</p>
                <p className="text-xs text-muted-foreground">First, download your dashboard report</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">Open Notion</p>
                <p className="text-xs text-muted-foreground">Navigate to your desired page</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">Drag and drop or paste</p>
                <p className="text-xs text-muted-foreground">Your file will be embedded automatically</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Tip: Use the embed code option to create a live dashboard embed
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Slack Integration Modal
function SlackIntegrationModal({ onClose, data }: { onClose: () => void; data: ParsedData }) {
  const [webhookUrl, setWebhookUrl] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    if (!webhookUrl) return
    setIsSending(true)
    setTimeout(() => {
      setIsSending(false)
      setSent(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    }, 1500)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Share to Slack
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {sent ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <Check className="h-6 w-6 text-success" />
              </div>
              <p className="text-lg font-semibold">Sent to Slack!</p>
              <p className="text-sm text-muted-foreground">Your dashboard summary has been shared</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Enter your Slack webhook URL to share a summary of your dashboard.
              </p>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Webhook URL</label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="bg-muted/50 font-mono text-sm"
                />
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs font-medium mb-2">Message Preview:</p>
                <div className="rounded bg-background p-3 border border-border/50">
                  <p className="text-sm font-medium">DataDash Report: {data.fileName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.rowCount.toLocaleString()} rows | {data.columnCount} columns
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Key insight: Revenue grew 12.5% over the analyzed period...
                  </p>
                </div>
              </div>
              <Button onClick={handleSend} className="w-full" disabled={!webhookUrl || isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send to Slack
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ExportModal({ isOpen, onClose, data, mode }: ExportModalProps) {
  if (!isOpen || !mode) return null

  switch (mode) {
    case "share-link":
      return <ShareLinkModal onClose={onClose} data={data} />
    case "embed-code":
      return <EmbedCodeModal onClose={onClose} data={data} />
    case "pdf-preview":
      return <PDFPreviewModal onClose={onClose} data={data} />
    default:
      return null
  }
}

// Additional exports for specific modals
export { NotionInstructionsModal, SlackIntegrationModal }
