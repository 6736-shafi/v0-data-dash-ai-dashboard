"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ChevronRight, ChevronLeft, Sparkles, Download, MessageSquare, BarChart3, Table2, Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TourStep {
  id: string
  target: string
  title: string
  description: string
  position: "top" | "bottom" | "left" | "right"
  icon: typeof Sparkles
}

const tourSteps: TourStep[] = [
  {
    id: "kpi-cards",
    target: "[data-tour='kpi-cards']",
    title: "KPI Overview",
    description: "Quick glance at your key metrics with trend indicators and sparklines.",
    position: "bottom",
    icon: BarChart3,
  },
  {
    id: "charts",
    target: "[data-tour='charts']",
    title: "Interactive Charts",
    description: "Click, zoom, and brush to explore your data. Click on data points for details.",
    position: "top",
    icon: BarChart3,
  },
  {
    id: "ai-insights",
    target: "[data-tour='ai-insights']",
    title: "AI-Powered Insights",
    description: "Automatic analysis of your data with actionable recommendations.",
    position: "left",
    icon: Sparkles,
  },
  {
    id: "export",
    target: "[data-tour='export']",
    title: "Export & Share",
    description: "Download as PDF, PNG, or share via link. Multiple export formats available.",
    position: "bottom",
    icon: Download,
  },
  {
    id: "ai-chat",
    target: "[data-tour='ai-chat']",
    title: "AI Chat Assistant",
    description: "Ask questions about your data in natural language. Get instant answers.",
    position: "left",
    icon: MessageSquare,
  },
]

interface OnboardingTourProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function OnboardingTour({ isOpen, onClose, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })

  const step = tourSteps[currentStep]

  useEffect(() => {
    if (!isOpen || !step) return

    const targetEl = document.querySelector(step.target)
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect()
      const scrollTop = window.scrollY
      const scrollLeft = window.scrollX

      let top = 0
      let left = 0

      switch (step.position) {
        case "bottom":
          top = rect.bottom + scrollTop + 12
          left = rect.left + scrollLeft + rect.width / 2
          break
        case "top":
          top = rect.top + scrollTop - 12
          left = rect.left + scrollLeft + rect.width / 2
          break
        case "left":
          top = rect.top + scrollTop + rect.height / 2
          left = rect.left + scrollLeft - 12
          break
        case "right":
          top = rect.top + scrollTop + rect.height / 2
          left = rect.right + scrollLeft + 12
          break
      }

      setTooltipPosition({ top, left })

      // Add highlight to target
      targetEl.classList.add("tour-highlight")
      return () => targetEl.classList.remove("tour-highlight")
    }
  }, [isOpen, step, currentStep])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  if (!isOpen || !step) return null

  const StepIcon = step.icon

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm" />

      {/* Tooltip */}
      <div
        className={cn(
          "fixed z-[101] w-80 rounded-xl border border-border bg-card p-4 shadow-2xl",
          step.position === "bottom" && "-translate-x-1/2",
          step.position === "top" && "-translate-x-1/2 -translate-y-full",
          step.position === "left" && "-translate-x-full -translate-y-1/2",
          step.position === "right" && "-translate-y-1/2"
        )}
        style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
      >
        {/* Arrow */}
        <div
          className={cn(
            "absolute h-3 w-3 rotate-45 border bg-card",
            step.position === "bottom" && "-top-1.5 left-1/2 -translate-x-1/2 border-l border-t",
            step.position === "top" && "-bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b",
            step.position === "left" && "-right-1.5 top-1/2 -translate-y-1/2 border-r border-t",
            step.position === "right" && "-left-1.5 top-1/2 -translate-y-1/2 border-l border-b"
          )}
        />

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute right-2 top-2 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <StepIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{step.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-6 rounded-full transition-colors",
                  i <= currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} of {tourSteps.length}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip tour
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev} className="bg-transparent">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {currentStep === tourSteps.length - 1 ? "Finish" : "Next"}
              {currentStep < tourSteps.length - 1 && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

// Keyboard shortcuts modal
interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const shortcuts = [
  { keys: ["/"], description: "Focus search" },
  { keys: ["E"], description: "Open export menu" },
  { keys: ["N"], description: "Upload new file" },
  { keys: ["D"], description: "Toggle dashboard view" },
  { keys: ["T"], description: "Toggle data table view" },
  { keys: ["C"], description: "Open AI chat" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["Esc"], description: "Close modals" },
]

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Keyboard className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.description}
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50"
            >
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded-md border border-border bg-muted px-2 py-1 text-xs font-mono font-medium text-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono">?</kbd> anytime to show this menu
          </p>
        </div>
      </div>
    </div>
  )
}

// Feature discovery dot component
interface FeatureDiscoveryDotProps {
  show: boolean
  className?: string
}

export function FeatureDiscoveryDot({ show, className }: FeatureDiscoveryDotProps) {
  if (!show) return null

  return (
    <span className={cn("relative flex h-2 w-2", className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
    </span>
  )
}

// Keyboard shortcut hint badge
interface ShortcutHintProps {
  show: boolean
  onDismiss: () => void
}

export function ShortcutHint({ show, onDismiss }: ShortcutHintProps) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setVisible(false)
        onDismiss()
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [show, onDismiss])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-full border border-border bg-card/95 backdrop-blur-sm px-4 py-2 shadow-lg">
        <Keyboard className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Press <kbd className="mx-1 rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono font-medium text-foreground">?</kbd> for keyboard shortcuts
        </span>
        <button
          onClick={() => {
            setVisible(false)
            onDismiss()
          }}
          className="ml-1 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(handlers: {
  onSearch?: () => void
  onExport?: () => void
  onNewFile?: () => void
  onDashboard?: () => void
  onTable?: () => void
  onChat?: () => void
  onHelp?: () => void
  onEscape?: () => void
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === "Escape" && handlers.onEscape) {
          handlers.onEscape()
        }
        return
      }

      switch (e.key) {
        case "/":
          e.preventDefault()
          handlers.onSearch?.()
          break
        case "e":
        case "E":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            handlers.onExport?.()
          }
          break
        case "n":
        case "N":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            handlers.onNewFile?.()
          }
          break
        case "d":
        case "D":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            handlers.onDashboard?.()
          }
          break
        case "t":
        case "T":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            handlers.onTable?.()
          }
          break
        case "c":
        case "C":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            handlers.onChat?.()
          }
          break
        case "?":
          e.preventDefault()
          handlers.onHelp?.()
          break
        case "Escape":
          handlers.onEscape?.()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handlers])
}
