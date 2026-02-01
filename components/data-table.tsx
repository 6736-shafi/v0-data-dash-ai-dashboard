"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  X,
  FileSearch,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { ParsedData } from "@/app/page"

interface DataTableProps {
  data: ParsedData
  visibleColumns: Set<string>
  isLoading?: boolean
}

type SortConfig = {
  column: string
  direction: "asc" | "desc"
} | null

type ColumnFilters = Record<string, Set<string>>

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function DataTable({ data, visibleColumns, isLoading = false }: DataTableProps) {
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({})
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const resizeStartX = useRef(0)
  const resizeStartWidth = useRef(0)
  const tableRef = useRef<HTMLDivElement>(null)

  // Initialize column order from visible columns
  useEffect(() => {
    const orderedCols = data.columns.filter((col) => visibleColumns.has(col))
    if (columnOrder.length === 0 || columnOrder.length !== orderedCols.length) {
      setColumnOrder(orderedCols)
    }
  }, [data.columns, visibleColumns, columnOrder.length])

  const columns = columnOrder.filter((col) => visibleColumns.has(col))

  // Get unique values for each column (for filters)
  const columnUniqueValues = useMemo(() => {
    const values: Record<string, Set<string>> = {}
    columns.forEach((col) => {
      values[col] = new Set(data.rows.map((row) => String(row[col])))
    })
    return values
  }, [columns, data.rows])

  const filteredAndSortedRows = useMemo(() => {
    let rows = data.rows.map((row, index) => ({ ...row, __originalIndex: index }))

    // Filter by search
    if (search) {
      rows = rows.filter((row) =>
        columns.some((col) =>
          String(row[col]).toLowerCase().includes(search.toLowerCase())
        )
      )
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([col, values]) => {
      if (values.size > 0) {
        rows = rows.filter((row) => values.has(String(row[col])))
      }
    })

    // Sort
    if (sortConfig) {
      rows = [...rows].sort((a, b) => {
        const aVal = a[sortConfig.column]
        const bVal = b[sortConfig.column]

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal
        }

        const aStr = String(aVal)
        const bStr = String(bVal)
        return sortConfig.direction === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr)
      })
    }

    return rows
  }, [data.rows, columns, search, sortConfig, columnFilters])

  const totalPages = Math.ceil(filteredAndSortedRows.length / pageSize)
  const paginatedRows = filteredAndSortedRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleSort = (column: string) => {
    setSortConfig((current) => {
      if (current?.column === column) {
        if (current.direction === "asc") {
          return { column, direction: "desc" }
        }
        return null
      }
      return { column, direction: "asc" }
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIndices = new Set(paginatedRows.map((row) => row.__originalIndex))
      setSelectedRows(allIndices)
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (index: number, checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(index)
      } else {
        next.delete(index)
      }
      return next
    })
  }

  const toggleRowExpanded = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleColumnFilter = (column: string, value: string, checked: boolean) => {
    setColumnFilters((prev) => {
      const next = { ...prev }
      if (!next[column]) {
        next[column] = new Set()
      }
      const newSet = new Set(next[column])
      if (checked) {
        newSet.add(value)
      } else {
        newSet.delete(value)
      }
      next[column] = newSet
      return next
    })
    setCurrentPage(1)
  }

  const clearColumnFilter = (column: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev }
      delete next[column]
      return next
    })
    setCurrentPage(1)
  }

  // Column drag and drop
  const handleDragStart = (column: string) => {
    setDraggedColumn(column)
  }

  const handleDragOver = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault()
    if (draggedColumn && draggedColumn !== targetColumn) {
      setColumnOrder((prev) => {
        const newOrder = [...prev]
        const dragIndex = newOrder.indexOf(draggedColumn)
        const targetIndex = newOrder.indexOf(targetColumn)
        newOrder.splice(dragIndex, 1)
        newOrder.splice(targetIndex, 0, draggedColumn)
        return newOrder
      })
    }
  }

  const handleDragEnd = () => {
    setDraggedColumn(null)
  }

  // Column resize
  const handleResizeStart = useCallback((e: React.MouseEvent, column: string) => {
    e.preventDefault()
    setResizingColumn(column)
    resizeStartX.current = e.clientX
    resizeStartWidth.current = columnWidths[column] || 150
  }, [columnWidths])

  useEffect(() => {
    if (!resizingColumn) return

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX.current
      const newWidth = Math.max(80, resizeStartWidth.current + diff)
      setColumnWidths((prev) => ({ ...prev, [resizingColumn]: newWidth }))
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [resizingColumn])

  // Highlight matching text
  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm) return text
    const parts = String(text).split(new RegExp(`(${searchTerm})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={i} className="highlight-match">{part}</mark>
      ) : (
        part
      )
    )
  }

  const handleExport = () => {
    const headers = columns.join(",")
    const rows = filteredAndSortedRows
      .map((row) => columns.map((col) => `"${row[col]}"`).join(","))
      .join("\n")
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `filtered_${data.fileName}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const allSelected =
    paginatedRows.length > 0 &&
    paginatedRows.every((row) => selectedRows.has(row.__originalIndex))
  const someSelected =
    paginatedRows.some((row) => selectedRows.has(row.__originalIndex)) && !allSelected

  const activeFiltersCount = Object.values(columnFilters).filter((v) => v.size > 0).length

  const startRow = filteredAndSortedRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endRow = Math.min(currentPage * pageSize, filteredAndSortedRows.length)

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="glass-card rounded-xl">
        <div className="flex items-center justify-between border-b border-border/50 p-4">
          <div className="h-6 w-32 rounded bg-muted animate-skeleton-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-64 rounded bg-muted animate-skeleton-pulse" />
            <div className="h-9 w-28 rounded bg-muted animate-skeleton-pulse" />
          </div>
        </div>
        <div className="p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 py-3 border-b border-border/30 animate-skeleton-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="h-4 w-4 rounded bg-muted" />
              {Array.from({ length: 5 }).map((_, j) => (
                <div
                  key={j}
                  className="h-4 flex-1 rounded bg-muted"
                  style={{ maxWidth: `${100 + j * 30}px` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (filteredAndSortedRows.length === 0 && (search || activeFiltersCount > 0)) {
    return (
      <div className="glass-card rounded-xl">
        <div className="flex items-center justify-between border-b border-border/50 p-4">
          <h3 className="font-semibold text-foreground">Data Preview</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search data..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-9 w-64 pl-9 bg-muted/50"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("")
                setColumnFilters({})
              }}
              className="bg-transparent"
            >
              Clear Filters
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted/50 p-6 mb-4">
            <FileSearch className="h-12 w-12 text-muted-foreground" />
          </div>
          <h4 className="text-lg font-semibold text-foreground mb-2">No results found</h4>
          <p className="text-muted-foreground text-center max-w-md">
            No data matches your search criteria. Try adjusting your search terms or clearing the filters.
          </p>
          <Button
            variant="outline"
            className="mt-4 bg-transparent"
            onClick={() => {
              setSearch("")
              setColumnFilters({})
            }}
          >
            Clear all filters
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-foreground">Data Preview</h3>
          {selectedRows.size > 0 && (
            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
              {selectedRows.size} selected
            </span>
          )}
          {activeFiltersCount > 0 && (
            <span className="rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-medium text-warning">
              {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search data..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="h-9 w-64 pl-9 bg-muted/50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="bg-transparent">
            <Download className="mr-2 h-4 w-4" />
            Download filtered data
          </Button>
        </div>
      </div>

      {/* Table */}
      <div ref={tableRef} className="overflow-auto max-h-[600px]">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border/50 bg-muted/30">
              {/* Checkbox column */}
              <th className="sticky left-0 top-0 z-20 bg-muted/30 w-12 px-4 py-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                />
              </th>
              {columns.map((column) => (
                <th
                  key={column}
                  draggable
                  onDragStart={() => handleDragStart(column)}
                  onDragOver={(e) => handleDragOver(e, column)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "relative bg-muted/30 px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                    draggedColumn === column && "opacity-50"
                  )}
                  style={{ width: columnWidths[column] || "auto", minWidth: 80 }}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground/50" />
                    <button
                      onClick={() => handleSort(column)}
                      className="flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      <span className="truncate">{column.replace(/_/g, " ")}</span>
                      {sortConfig?.column === column ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowUp className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <ArrowDown className="h-4 w-4 flex-shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 flex-shrink-0 opacity-50" />
                      )}
                    </button>
                    
                    {/* Filter dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            "p-1 rounded hover:bg-muted/50 transition-colors",
                            columnFilters[column]?.size && "text-primary"
                          )}
                        >
                          <Filter className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-auto">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Filter by {column.replace(/_/g, " ")}
                        </div>
                        <DropdownMenuSeparator />
                        {columnFilters[column]?.size ? (
                          <DropdownMenuItem onClick={() => clearColumnFilter(column)}>
                            <X className="mr-2 h-4 w-4" />
                            Clear filter
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        {Array.from(columnUniqueValues[column] || [])
                          .slice(0, 20)
                          .map((value) => (
                            <DropdownMenuCheckboxItem
                              key={value}
                              checked={columnFilters[column]?.has(value) || false}
                              onCheckedChange={(checked) =>
                                handleColumnFilter(column, value, checked)
                              }
                            >
                              <span className="truncate">{value || "(empty)"}</span>
                            </DropdownMenuCheckboxItem>
                          ))}
                        {(columnUniqueValues[column]?.size || 0) > 20 && (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            +{(columnUniqueValues[column]?.size || 0) - 20} more values
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Resize handle */}
                  <div
                    className={cn(
                      "resize-handle",
                      resizingColumn === column && "resizing"
                    )}
                    onMouseDown={(e) => handleResizeStart(e, column)}
                  />
                </th>
              ))}
              {/* Actions column */}
              <th className="sticky right-0 top-0 z-20 bg-muted/30 w-24 px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, rowIndex) => {
              const originalIndex = row.__originalIndex
              const isSelected = selectedRows.has(originalIndex)
              const isExpanded = expandedRows.has(originalIndex)

              return (
                <React.Fragment key={originalIndex}>
                  <tr
                    className={cn(
                      "group border-b border-border/30 transition-colors animate-row-slide-in cursor-pointer",
                      isSelected ? "bg-primary/10" : rowIndex % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]",
                      "hover:bg-muted/30"
                    )}
                    style={{ animationDelay: `${rowIndex * 30}ms` }}
                    onClick={() => toggleRowExpanded(originalIndex)}
                  >
                    {/* Checkbox */}
                    <td
                      className="sticky left-0 bg-inherit px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectRow(originalIndex, checked as boolean)
                        }
                      />
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column}
                        className="max-w-48 truncate px-4 py-3 text-sm text-foreground"
                        title={String(row[column])}
                        style={{ width: columnWidths[column] || "auto" }}
                      >
                        {typeof row[column] === "number"
                          ? row[column].toLocaleString()
                          : highlightMatch(String(row[column]), search)}
                      </td>
                    ))}
                    {/* Row actions */}
                    <td
                      className="sticky right-0 bg-inherit px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                          title="View"
                          onClick={() => toggleRowExpanded(originalIndex)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded row details */}
                  {isExpanded && (
                    <tr className="bg-muted/20">
                      <td colSpan={columns.length + 2} className="px-4 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {data.columns.map((col) => (
                            <div key={col} className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                {col.replace(/_/g, " ")}
                              </p>
                              <p className="text-sm text-foreground">
                                {typeof row[col] === "number"
                                  ? row[col].toLocaleString()
                                  : String(row[col]) || "-"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {startRow}-{endRow} of {filteredAndSortedRows.length.toLocaleString()}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 bg-transparent">
                {pageSize} per page
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => {
                    setPageSize(size)
                    setCurrentPage(1)
                  }}
                >
                  {size} per page
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="h-8 w-8"
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="mx-2 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-8 w-8"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-8 w-8"
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Need to import React for Fragment
import React from "react"
