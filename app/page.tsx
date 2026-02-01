"use client"

import { useState } from "react"
import { LandingPage } from "@/components/landing-page"
import { Dashboard } from "@/components/dashboard"

export interface ParsedData {
  columns: string[]
  rows: Record<string, string | number>[]
  fileName: string
  rowCount: number
  columnCount: number
}

export default function Home() {
  const [data, setData] = useState<ParsedData | null>(null)

  const handleDataLoaded = (parsedData: ParsedData) => {
    setData(parsedData)
  }

  const handleReset = () => {
    setData(null)
  }

  if (data) {
    return <Dashboard data={data} onReset={handleReset} />
  }

  return <LandingPage onDataLoaded={handleDataLoaded} />
}
