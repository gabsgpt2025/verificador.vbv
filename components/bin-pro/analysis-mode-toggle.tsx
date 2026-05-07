"use client"

import type { KeyboardEvent } from "react"
import { cn } from "@/lib/utils"
import type { AnalysisMode } from "@/lib/analysis/useAnalysisMode"

const modeOptions: Array<{ value: AnalysisMode; label: string }> = [
  { value: "analyst", label: "🧑‍💼 Analista" },
  { value: "merchant", label: "🛒 Comerciante" },
  { value: "both", label: "👥 Ambos" },
]

interface AnalysisModeToggleProps {
  value: AnalysisMode
  onChange: (mode: AnalysisMode) => void
}

export function AnalysisModeToggle({ value, onChange }: AnalysisModeToggleProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return
    }

    event.preventDefault()
    const currentIndex = modeOptions.findIndex((option) => option.value === value)
    const delta = event.key === "ArrowRight" ? 1 : -1
    const nextIndex = (currentIndex + delta + modeOptions.length) % modeOptions.length
    onChange(modeOptions[nextIndex].value)
  }

  return (
    <div
      role="radiogroup"
      aria-label="Modo de linguagem da análise"
      className="inline-flex rounded-lg border border-border bg-muted/10 p-1"
      onKeyDown={onKeyDown}
    >
      {modeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-mono transition-colors",
            value === option.value
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
