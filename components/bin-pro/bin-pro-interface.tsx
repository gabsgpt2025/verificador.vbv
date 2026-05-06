"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CyberText } from "@/components/cyberpunk/cyber-typography"
import { BinAnalysisV2Cards } from "./bin-analysis-v2-cards"
import { BinProGlossary } from "./bin-pro-glossary"
import { BinProHistory } from "./bin-pro-history"
import type { BINAnalysisV2Result } from "@/src/lib/intelligence/types"
import { Search, Loader2, AlertTriangle, CheckCircle, XCircle, Shield } from "lucide-react"

interface BinProInterfaceProps {
  userId: string
}

export function BinProInterface({ userId }: BinProInterfaceProps) {
  const [bin, setBin] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<BINAnalysisV2Result | null>(null)
  const [error, setError] = useState("")

  const handleAnalyze = async () => {
    const cleanBin = bin.replace(/\D/g, "")
    if (!cleanBin || cleanBin.length < 6) {
      setError("Informe um BIN válido (6 ou mais dígitos)")
      return
    }

    setIsAnalyzing(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/bin-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bin: cleanBin }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Falha na análise")
      }

      const analysisResult = await response.json()
      setResult(analysisResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na análise")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "BAIXO":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "MEDIO":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      case "ALTO":
        return <XCircle className="h-4 w-4 text-orange-400" />
      case "CRITICO":
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Analysis Input */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-mono text-primary neon-glow">
            <Shield className="h-5 w-5" />
            <span>VERIFÍBIN 2.0 — ANÁLISE ANTIFRAUDE</span>
          </CardTitle>
          <CardDescription className="font-mono">
            Plataforma profissional de inteligência de risco e análise de BIN.
            Classifica risco, estima suporte a 3DS/VBV e avalia qualidade dos dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-md">
            <CyberText variant="caption" className="text-blue-400 text-xs">
              ℹ️ Esta ferramenta é um sistema de análise antifraude e inteligência de risco.
              Status 3DS é estimado com base em país, bandeira, tipo e emissor — não confirmado diretamente por API.
              Probabilidades são inferências, não certezas.
            </CyberText>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-mono font-medium mb-2">Número do BIN</label>
              <Input
                placeholder="Ex: 405708 ou 40570891"
                value={bin}
                onChange={(e) => setBin(e.target.value)}
                className="font-mono"
                maxLength={19}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <CyberText color="destructive" variant="caption">
                {error}
              </CyberText>
            </div>
          )}

          <Button onClick={handleAnalyze} disabled={isAnalyzing || !bin} className="w-full md:w-auto" variant="accent">
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analisar BIN (3 Créditos)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {result && (
        <div className="space-y-4">
          {/* Overview Bar */}
          <Card className="cyber-card">
            <CardContent className="py-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <CyberText variant="caption" color="muted">BIN</CyberText>
                  <CyberText className="font-mono font-bold">{result.bin}</CyberText>
                </div>
                <div>
                  <CyberText variant="caption" color="muted">Bandeira</CyberText>
                  <CyberText className="font-mono font-bold">{result.technicalData.brand ?? "—"}</CyberText>
                </div>
                <div>
                  <CyberText variant="caption" color="muted">País</CyberText>
                  <CyberText className="font-mono font-bold">{result.technicalData.countryCode ?? "—"}</CyberText>
                </div>
                <div>
                  <CyberText variant="caption" color="muted">Score de Risco</CyberText>
                  <div className="flex items-center gap-1">
                    {getRiskIcon(result.riskAnalysis.level)}
                    <CyberText className="font-mono font-bold text-accent">{result.riskAnalysis.score}/100</CyberText>
                  </div>
                </div>
                <div>
                  <CyberText variant="caption" color="muted">Recomendação</CyberText>
                  <Badge variant="outline" className="font-mono text-xs">
                    {result.riskAnalysis.recommendation}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5 Analysis Cards */}
          <BinAnalysisV2Cards result={result} />
        </div>
      )}

      {/* Glossary and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BinProGlossary />
        <BinProHistory userId={userId} />
      </div>
    </div>
  )
}

