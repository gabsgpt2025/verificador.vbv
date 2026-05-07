"use client"

import { Shield, BarChart2, Globe } from "lucide-react"
import { CyberText } from "@/components/cyberpunk/cyber-typography"
import { useAnalysisMode } from "@/lib/analysis/useAnalysisMode"

export function BinProHighlights() {
  const { mode } = useAnalysisMode()
  const isAnalyst = mode === "analyst"

  return (
    <div className="flex items-center space-x-6 mt-4">
      <div className="flex items-center space-x-2">
        <Shield className="h-4 w-4 text-secondary" />
        <CyberText variant="caption" color="secondary">
          {isAnalyst ? "Score Explicável" : "Entenda o porquê da nota"}
        </CyberText>
      </div>
      <div className="flex items-center space-x-2">
        <BarChart2 className="h-4 w-4 text-accent" />
        <CyberText variant="caption" color="accent">
          Análise 3DS/VBV Inferida
        </CyberText>
      </div>
      <div className="flex items-center space-x-2">
        <Globe className="h-4 w-4 text-primary" />
        <CyberText variant="caption" color="primary">
          {isAnalyst ? "Compliance Regulatório" : "Está dentro das regras? (Compliance)"}
        </CyberText>
      </div>
    </div>
  )
}
