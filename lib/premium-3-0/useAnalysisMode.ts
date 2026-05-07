"use client"

import { useEffect, useState } from "react"

export type AnalysisMode = "analyst" | "merchant" | "both"

export const ANALYSIS_MODE_STORAGE_KEY = "verifibin:analysisMode"

function isAnalysisMode(value: string | null): value is AnalysisMode {
  return value === "analyst" || value === "merchant" || value === "both"
}

export function useAnalysisMode() {
  const [mode, setMode] = useState<AnalysisMode>("both")

  useEffect(() => {
    const storedMode = window.localStorage.getItem(ANALYSIS_MODE_STORAGE_KEY)
    if (isAnalysisMode(storedMode)) {
      setMode(storedMode)
    }
  }, [])

  const updateMode = (nextMode: AnalysisMode) => {
    setMode(nextMode)
    window.localStorage.setItem(ANALYSIS_MODE_STORAGE_KEY, nextMode)
  }

  return { mode, setMode: updateMode }
}
