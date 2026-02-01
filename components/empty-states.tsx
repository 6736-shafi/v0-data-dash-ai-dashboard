"use client"

import { FileQuestion, AlertTriangle, BarChart3, RefreshCw, Upload, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  className?: string
}

// No data uploaded state
export function NoDataState({ className, onUpload }: EmptyStateProps & { onUpload?: () => void }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <div className="relative mb-6">
        <div className="rounded-2xl bg-primary/10 p-6">
          <Upload className="h-12 w-12 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary/40 animate-ping" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">No data yet</h3>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        Upload a file to get started with your AI-powered dashboard
      </p>
      {onUpload && (
        <Button onClick={onUpload}>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      )}
    </div>
  )
}

// Error loading state
interface ErrorStateProps extends EmptyStateProps {
  error?: string
  onRetry?: () => void
  showDetails?: boolean
}

export function ErrorState({ className, error, onRetry, showDetails = false }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <div className="rounded-2xl bg-destructive/10 p-6 mb-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h3>
      <p className="text-muted-foreground text-center max-w-sm mb-4">
        We couldn&apos;t load your data. Please try again.
      </p>
      {showDetails && error && (
        <details className="mb-4 w-full max-w-md">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
            Show error details
          </summary>
          <pre className="mt-2 p-3 rounded-lg bg-muted text-xs text-muted-foreground overflow-auto max-h-32">
            {error}
          </pre>
        </details>
      )}
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="bg-transparent">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  )
}

// Chart with no data for selected filters
export function ChartNoDataState({ className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
      <div className="rounded-xl bg-muted/50 p-4 mb-4">
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h4 className="text-sm font-medium text-foreground mb-1">No data available</h4>
      <p className="text-xs text-muted-foreground text-center max-w-[200px]">
        Try adjusting your filters to see chart data
      </p>
    </div>
  )
}

// Search no results state
export function SearchNoResultsState({ 
  className, 
  searchTerm,
  onClear 
}: EmptyStateProps & { searchTerm?: string; onClear?: () => void }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <div className="rounded-2xl bg-muted/50 p-6 mb-6">
        <SearchX className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
      <p className="text-muted-foreground text-center max-w-sm mb-4">
        {searchTerm ? (
          <>No matches for &quot;<span className="font-medium text-foreground">{searchTerm}</span>&quot;</>
        ) : (
          "Try a different search term"
        )}
      </p>
      {onClear && (
        <Button onClick={onClear} variant="outline" size="sm" className="bg-transparent">
          Clear search
        </Button>
      )}
    </div>
  )
}

// File not found / invalid state
export function FileNotFoundState({ className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <div className="rounded-2xl bg-warning/10 p-6 mb-6">
        <FileQuestion className="h-12 w-12 text-warning" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">File not found</h3>
      <p className="text-muted-foreground text-center max-w-sm">
        The file you&apos;re looking for doesn&apos;t exist or has been removed
      </p>
    </div>
  )
}

// Loading skeleton for table rows
export function TableLoadingSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {/* Header skeleton */}
      <div className="flex gap-4 pb-3 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded bg-muted animate-skeleton-pulse"
            style={{ width: `${Math.random() * 60 + 60}px` }}
          />
        ))}
      </div>
      
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 py-3"
          style={{ animationDelay: `${rowIndex * 100}ms` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 rounded bg-muted animate-skeleton-pulse"
              style={{ 
                width: `${Math.random() * 80 + 40}px`,
                animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// Loading skeleton for charts
export function ChartLoadingSkeleton({ className }: EmptyStateProps) {
  return (
    <div className={cn("p-4", className)}>
      {/* Chart title skeleton */}
      <div className="h-5 w-32 rounded bg-muted animate-skeleton-pulse mb-4" />
      
      {/* Chart area skeleton */}
      <div className="relative h-64 rounded-lg bg-muted/30 overflow-hidden">
        {/* Fake bar chart */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-4 pb-4 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-muted animate-skeleton-pulse"
              style={{ 
                height: `${Math.random() * 60 + 20}%`,
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
        
        {/* Grid lines */}
        <div className="absolute inset-x-4 top-4 bottom-12 flex flex-col justify-between">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-px bg-border/30" />
          ))}
        </div>
      </div>
    </div>
  )
}

// KPI card loading skeleton
export function KPILoadingSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-skeleton-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-lg bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-8 w-24 rounded bg-muted" />
        <div className="h-4 w-32 rounded bg-muted" />
      </div>
    </div>
  )
}
