"use client"

import { useState, type ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CyberText } from "@/components/cyberpunk/cyber-typography"
import type { FullBinAnalysis } from "@/lib/bin/types"
import { AnalysisModeToggle } from "@/components/bin-pro/analysis-mode-toggle"
import { useAnalysisMode, type AnalysisMode } from "@/lib/analysis/useAnalysisMode"
import { findGlossaryEntry, formatGlossaryTerm, translateGlossaryText } from "@/lib/analysis/glossary"
import {
  buildAnalystActions,
  buildExecutiveDescription,
  buildExecutiveHeadline,
  buildMerchantActions,
  buildWhyThisScore,
  getRiskSegment,
  groupRiskFactors,
  riskSegments,
} from "@/lib/analysis/presentation"
import {
  Search,
  Loader2,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  BarChart2,
  Database,
  Globe,
  CreditCard,
  Lock,
} from "lucide-react"

interface VeriFiBINInterfaceProps {
  userId: string
}

function InferredBadge() {
  return (
    <Badge variant="outline" className="text-xs font-mono border-yellow-500/50 text-yellow-400 ml-1">
      Inferido
    </Badge>
  )
}

function RealApiBadge() {
  return (
    <Badge variant="outline" className="text-xs font-mono border-green-500/50 text-green-400 ml-1">
      Dado real
    </Badge>
  )
}

function DataField({
  label,
  value,
  isInferred = false,
}: {
  label: string
  value: string | number | boolean | null | undefined
  isInferred?: boolean
}) {
  const displayValue =
    value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "boolean"
        ? value
          ? "Sim"
          : "Não"
        : String(value)

  return (
    <div>
      <div className="flex items-center">
        <CyberText variant="caption" color="muted">
          {label}
        </CyberText>
        {isInferred ? <InferredBadge /> : displayValue !== "—" ? <RealApiBadge /> : null}
      </div>
      <CyberText className="font-mono font-bold">{displayValue}</CyberText>
    </div>
  )
}

function getRiskBadgeVariant(level: string) {
  switch (level) {
    case "LOW":
      return "default"
    case "MEDIUM":
      return "secondary"
    case "HIGH":
    case "CRITICAL":
      return "destructive"
    default:
      return "default"
  }
}

function getRiskIcon(level: string) {
  switch (level) {
    case "LOW":
      return <CheckCircle className="h-4 w-4" />
    case "MEDIUM":
      return <AlertTriangle className="h-4 w-4" />
    case "HIGH":
    case "CRITICAL":
      return <XCircle className="h-4 w-4" />
    default:
      return <AlertTriangle className="h-4 w-4" />
  }
}

function RiskImpact({ impact }: { impact: number }) {
  const color = impact > 0 ? "text-destructive" : "text-green-400"
  const prefix = impact > 0 ? "+" : ""
  return <span className={`font-mono font-bold ${color}`}>{prefix}{impact}</span>
}

function GlossaryTerm({ term, mode }: { term: string; mode: AnalysisMode }) {
  const entry = findGlossaryEntry(term)

  if (!entry) {
    return <>{term}</>
  }

  const tooltipId = `glossary-${entry.technical.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`

  return (
    <span aria-describedby={tooltipId} title={entry.tooltip}>
      {formatGlossaryTerm(entry.technical, mode)}
      <span id={tooltipId} className="sr-only">
        {entry.tooltip}
      </span>
    </span>
  )
}

function RiskImpactByMode({ impact, mode }: { impact: number; mode: AnalysisMode }) {
  if (mode === "merchant") {
    if (impact < 0) {
      return <span className="font-mono font-bold text-green-400">⬇️ Reduz risco</span>
    }
    return <span className="font-mono font-bold text-destructive">⬆️ Aumenta risco</span>
  }

  return <RiskImpact impact={impact} />
}

function ModeStack({
  mode,
  popular,
  technical,
}: {
  mode: AnalysisMode
  popular: ReactNode
  technical: ReactNode
}) {
  if (mode === "analyst") {
    return <>{technical}</>
  }

  if (mode === "merchant") {
    return <>{popular}</>
  }

  return (
    <div className="space-y-3">
      {popular}
      <details className="rounded-md border border-border bg-muted/10 p-3">
        <summary className="cursor-pointer text-xs font-mono text-muted-foreground">
          Ver detalhes técnicos
        </summary>
        <div className="mt-3">{technical}</div>
      </details>
    </div>
  )
}

function SegmentedRiskBar({ score }: { score: number }) {
  const markerPosition = `${Math.min(Math.max(score, 0), 100)}%`

  return (
    <div className="space-y-2">
      <div className="relative h-3 w-full overflow-hidden rounded-full border border-border">
        <div className="grid h-full grid-cols-4">
          {riskSegments.map((segment) => (
            <div key={segment.label} style={{ backgroundColor: segment.color }} />
          ))}
        </div>
        <div
          className="absolute top-[-3px] h-5 w-0.5 bg-background border border-foreground/80"
          style={{ left: markerPosition }}
          aria-hidden
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {riskSegments.map((segment) => (
          <CyberText key={segment.label} variant="caption" color="muted" className="text-[10px] text-center">
            {segment.label}
          </CyberText>
        ))}
      </div>
    </div>
  )
}

export function VeriFiBINInterface({ userId: _userId }: VeriFiBINInterfaceProps) {
  const [bin, setBin] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<FullBinAnalysis | null>(null)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("basica")
  const { mode, setMode } = useAnalysisMode()
  const isAnalystMode = mode === "analyst"

  const handleAnalyze = async () => {
    const cleanBin = bin.replace(/\s/g, "")
    if (!cleanBin || cleanBin.length < 6) {
      setError("Por favor, insira um BIN válido (mínimo 6 dígitos)")
      return
    }

    setIsAnalyzing(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/bin-analysis-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bin: cleanBin }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Falha na análise")
      }

      const analysisResult: FullBinAnalysis = await response.json()
      setResult(analysisResult)
      setActiveTab("basica")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na análise")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // userId is available for future use (e.g., analytics, session tracking)
  const riskSegment = result ? getRiskSegment(result.riskAnalysis.score) : null
  const groupedFactors = result ? groupRiskFactors(result.riskAnalysis.factors) : { favorable: [], attention: [] }
  const whyThisScore = result ? buildWhyThisScore(result) : ""

  return (
    <div className="space-y-8">
      {/* Input Card */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-mono text-primary neon-glow">
            <Shield className="h-5 w-5" />
            <span>{isAnalystMode ? "VeriFiBIN 2.0 — ANÁLISE ANTIFRAUDE DE BIN" : "VeriFiBIN 2.0 — Confira se esse cartão é confiável"}</span>
          </CardTitle>
          <CardDescription className="font-mono text-muted-foreground">
            Classificação de risco, inferência de autenticação e compliance regulatório
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-mono font-medium mb-2">BIN (6 ou 8 dígitos)</label>
              <Input
                placeholder="Ex: 405708 ou 40570812"
                value={bin}
                onChange={(e) => setBin(e.target.value.replace(/\D/g, "").substring(0, 8))}
                className="font-mono"
                maxLength={8}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || bin.replace(/\s/g, "").length < 6}
                variant="accent"
                className="whitespace-nowrap"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Analisar BIN (3 créditos)
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <CyberText color="muted" variant="caption" className="text-destructive">
                {error}
              </CyberText>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Tabs */}
      {result && (
        <div className="space-y-4">
          <Card className="cyber-card">
            <CardContent className="pt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CyberText variant="caption" color="muted">
                  Modo de linguagem da análise
                </CyberText>
                <CyberText className="font-mono font-semibold">Escolha a camada de leitura</CyberText>
              </div>
              <AnalysisModeToggle value={mode} onChange={setMode} />
            </CardContent>
          </Card>

          {/* Summary Banner */}
          <Card className="cyber-card">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CyberText variant="caption" color="muted">
                    BIN analisada
                  </CyberText>
                  <CyberText className="font-mono font-bold text-2xl text-primary neon-glow">
                    {result.bin}
                  </CyberText>
                </div>
                <Badge variant={getRiskBadgeVariant(result.riskAnalysis.level)} className="font-mono text-sm px-3 py-1">
                  {getRiskIcon(result.riskAnalysis.level)}
                  <span className="ml-2">RISCO {result.riskAnalysis.level}</span>
                </Badge>
                <div>
                  <CyberText variant="caption" color="muted">
                    Score de risco
                  </CyberText>
                  <CyberText className="font-mono font-bold text-2xl text-accent">
                    {result.riskAnalysis.score}/100
                  </CyberText>
                </div>
                <div>
                  <CyberText variant="caption" color="muted">
                    Fonte
                  </CyberText>
                  <CyberText className="font-mono font-bold">
                    {result.source.provider}
                  </CyberText>
                </div>
              </div>

              {/* Summary box */}
              <div className="mt-4 p-4 bg-muted/20 border border-border rounded-md space-y-1">
                <CyberText className="font-mono font-semibold">
                  {translateGlossaryText(result.finalSummary.title, mode)}
                </CyberText>
                <CyberText variant="caption" color="muted">
                  {translateGlossaryText(result.finalSummary.message, mode)}
                </CyberText>
                <CyberText variant="caption" className="text-accent">
                  {translateGlossaryText(result.finalSummary.action, mode)}
                </CyberText>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 font-mono">
              <TabsTrigger value="basica" className="text-xs">
                <CreditCard className="h-3 w-3 mr-1" />
                Básica
              </TabsTrigger>
              <TabsTrigger value="3ds" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                3DS/VBV
              </TabsTrigger>
              <TabsTrigger value="avancada" className="text-xs">
                <BarChart2 className="h-3 w-3 mr-1" />
                Avançada
              </TabsTrigger>
              <TabsTrigger value="admin" className="text-xs">
                <Database className="h-3 w-3 mr-1" />
                Inteligência
              </TabsTrigger>
            </TabsList>

            {/* ABA 1 — ANÁLISE BÁSICA */}
            <TabsContent value="basica">
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="font-mono text-primary text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    ANÁLISE BÁSICA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <DataField label="BIN" value={result.technicalData.bin} />
                    <DataField label="Bandeira" value={result.technicalData.brand} />
                    <DataField label="Tipo" value={result.technicalData.type} />
                    <DataField label="Categoria" value={result.technicalData.category} />
                    <DataField label="País" value={result.technicalData.countryName ?? result.technicalData.countryCode} />
                    <DataField label="Moeda" value={result.technicalData.currency} />
                    <DataField label="Emissor" value={result.technicalData.issuer} />
                    <DataField label="Comercial/PJ" value={result.technicalData.isCommercial} />
                    <DataField label="Pré-pago" value={result.technicalData.isPrepaid} />
                    <DataField label="Fonte dos dados" value={result.technicalData.source} />
                    <DataField label="Comprimento do BIN" value={`${result.technicalData.binLength} dígitos`} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 2 — 3DS/VBV */}
            <TabsContent value="3ds">
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="font-mono text-secondary text-sm flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    ANÁLISE 3DS/VBV
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Warning banner */}
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md flex items-start gap-2">
                    <Info className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <CyberText variant="caption" className="text-yellow-400">
                      Quando não confirmado pela API, esta análise é inferida por regras técnicas com base em país, bandeira, tipo e categoria da BIN.
                    </CyberText>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <CyberText variant="caption" color="muted">Status 3DS</CyberText>
                        {result.threeDSAnalysis.inferred && <InferredBadge />}
                      </div>
                      <Badge
                        variant={
                          result.threeDSAnalysis.status.includes("ACTIVE")
                            ? "default"
                            : result.threeDSAnalysis.status === "UNKNOWN"
                              ? "secondary"
                              : "destructive"
                        }
                        className="font-mono"
                      >
                        {result.threeDSAnalysis.status}
                      </Badge>
                    </div>

                    <div>
                      <CyberText variant="caption" color="muted">Confiança</CyberText>
                      <Badge
                        variant={
                          result.threeDSAnalysis.confidence === "HIGH"
                            ? "default"
                            : result.threeDSAnalysis.confidence === "MEDIUM"
                              ? "secondary"
                              : "destructive"
                        }
                        className="font-mono"
                      >
                        {result.threeDSAnalysis.confidence}
                      </Badge>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <CyberText variant="caption" color="muted">Challenge provável</CyberText>
                        <InferredBadge />
                      </div>
                      <CyberText className="font-mono font-bold">
                        {result.threeDSAnalysis.challengeLikelihood}
                      </CyberText>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <CyberText variant="caption" color="muted">Protocolo provável</CyberText>
                        <InferredBadge />
                      </div>
                      <CyberText className="font-mono font-bold">
                        {result.threeDSAnalysis.protocolLikely}
                      </CyberText>
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center gap-1 mb-1">
                        <CyberText variant="caption" color="muted">Métodos prováveis</CyberText>
                        <InferredBadge />
                      </div>
                      <CyberText className="font-mono font-bold">
                        {result.threeDSAnalysis.authMethodsLikely.length > 0
                          ? result.threeDSAnalysis.authMethodsLikely.join(", ")
                          : "—"}
                      </CyberText>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/10 border border-border rounded-md">
                    <CyberText variant="caption" color="muted" className="mb-1 block">
                      Explicação técnica
                    </CyberText>
                    <CyberText variant="caption" className="leading-relaxed">
                      {result.threeDSAnalysis.explanation}
                    </CyberText>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 3 — AVANÇADA */}
            <TabsContent value="avancada">
              <div className="space-y-4">
                {!isAnalystMode && riskSegment && (
                  <Card className="cyber-card">
                    <CardHeader>
                      <CardTitle className="font-mono text-primary text-sm">Resumo executivo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CyberText className="font-mono font-bold text-2xl" style={{ color: riskSegment.color }}>
                            {riskSegment.icon} {buildExecutiveHeadline(result)}
                          </CyberText>
                          <CyberText variant="caption" color="muted">
                            {buildExecutiveDescription(result)}
                          </CyberText>
                        </div>
                        <Badge className="font-mono text-sm" style={{ backgroundColor: riskSegment.color, color: "#0b0b0b" }}>
                          {result.riskAnalysis.score}/100
                        </Badge>
                      </div>
                      <div className="rounded-md border border-border bg-muted/20 p-3">
                        <CyberText className="font-mono font-semibold mb-1 block">👉 O que fazer</CyberText>
                        <ul className="space-y-1">
                          {buildMerchantActions(result).map((action) => (
                            <li key={action}>
                              <CyberText variant="caption">{action}</CyberText>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Risk Analysis */}
                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="font-mono text-accent text-sm flex items-center gap-2">
                      <BarChart2 className="h-4 w-4" />
                      {isAnalystMode ? "SCORE DE RISCO" : "Confira se esse cartão é confiável"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ModeStack
                      mode={mode}
                      popular={
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="col-span-2">
                              <CyberText variant="caption" color="muted">
                                Recomendação
                              </CyberText>
                              <CyberText className="font-mono font-bold">
                                <GlossaryTerm term={result.riskAnalysis.recommendation} mode={mode} />
                              </CyberText>
                            </div>
                            <div>
                              <CyberText variant="caption" color="muted">
                                Score
                              </CyberText>
                              <CyberText className="font-mono font-bold text-2xl text-accent">
                                {result.riskAnalysis.score}/100
                              </CyberText>
                            </div>
                            <div>
                              <CyberText variant="caption" color="muted">
                                Semáforo
                              </CyberText>
                              <CyberText className="font-mono font-bold" style={{ color: riskSegment?.color }}>
                                {riskSegment?.icon} {riskSegment?.label}
                              </CyberText>
                            </div>
                          </div>

                          <SegmentedRiskBar score={result.riskAnalysis.score} />

                          <div className="rounded-md border border-border bg-muted/10 p-3">
                            <CyberText className="font-mono font-semibold mb-1 block">Entenda o porquê da nota</CyberText>
                            <CyberText variant="caption" className="leading-relaxed">
                              {translateGlossaryText(whyThisScore, mode)}
                            </CyberText>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <CyberText className="font-mono font-semibold mb-2 block">✅ Pontos a favor</CyberText>
                              <div className="space-y-2">
                                {groupedFactors.favorable.length > 0 ? groupedFactors.favorable.map((factor, i) => (
                                  <div key={`fav-${i}`} className="flex items-start justify-between p-2 bg-muted/10 border border-border rounded gap-2">
                                    <div className="flex-1">
                                      <CyberText variant="caption" className="font-medium">{factor.label}</CyberText>
                                      <CyberText variant="caption" color="muted" className="text-xs">
                                        {translateGlossaryText(factor.reason, mode)}
                                      </CyberText>
                                    </div>
                                    <RiskImpactByMode impact={factor.impact} mode={mode} />
                                  </div>
                                )) : <CyberText variant="caption" color="muted">Sem pontos fortes relevantes no momento.</CyberText>}
                              </div>
                            </div>
                            <div>
                              <CyberText className="font-mono font-semibold mb-2 block">⚠️ Pontos de atenção</CyberText>
                              <div className="space-y-2">
                                {groupedFactors.attention.length > 0 ? groupedFactors.attention.map((factor, i) => (
                                  <div key={`att-${i}`} className="flex items-start justify-between p-2 bg-muted/10 border border-border rounded gap-2">
                                    <div className="flex-1">
                                      <CyberText variant="caption" className="font-medium">{factor.label}</CyberText>
                                      <CyberText variant="caption" color="muted" className="text-xs">
                                        {translateGlossaryText(factor.reason, mode)}
                                      </CyberText>
                                    </div>
                                    <RiskImpactByMode impact={factor.impact} mode={mode} />
                                  </div>
                                )) : <CyberText variant="caption" color="muted">Sem alertas críticos no momento.</CyberText>}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-md border border-border bg-muted/20 p-3">
                            <CyberText className="font-mono font-semibold mb-1 block">Checklist para comerciante</CyberText>
                            <ul className="space-y-1">
                              {buildMerchantActions(result).map((action) => (
                                <li key={`merchant-${action}`}>
                                  <CyberText variant="caption">{action}</CyberText>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      }
                      technical={
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <CyberText variant="caption" color="muted">Score</CyberText>
                              <CyberText className="font-mono font-bold text-2xl text-accent">
                                {result.riskAnalysis.score}/100
                              </CyberText>
                            </div>
                            <div>
                              <CyberText variant="caption" color="muted">Classificação</CyberText>
                              <Badge variant={getRiskBadgeVariant(result.riskAnalysis.level)} className="font-mono mt-1">
                                {result.riskAnalysis.level}
                              </Badge>
                            </div>
                            <div className="col-span-2">
                              <CyberText variant="caption" color="muted">Recomendação</CyberText>
                              <CyberText className="font-mono font-bold">
                                <GlossaryTerm term={result.riskAnalysis.recommendation} mode="analyst" />
                              </CyberText>
                            </div>
                          </div>

                          <SegmentedRiskBar score={result.riskAnalysis.score} />

                          <div>
                            <CyberText variant="caption" color="muted" className="mb-2 block font-semibold">
                              Fatores do score (score base: 30)
                            </CyberText>
                            <div className="space-y-2">
                              {result.riskAnalysis.factors.map((factor, i) => (
                                <div
                                  key={i}
                                  className="flex items-start justify-between p-2 bg-muted/10 border border-border rounded gap-2"
                                >
                                  <div className="flex-1">
                                    <CyberText variant="caption" className="font-medium">
                                      {factor.label}
                                    </CyberText>
                                    <CyberText variant="caption" color="muted" className="text-xs">
                                      {factor.reason}
                                    </CyberText>
                                  </div>
                                  <RiskImpact impact={factor.impact} />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-md border border-border bg-muted/20 p-3">
                            <CyberText className="font-mono font-semibold mb-1 block">Recomendações técnicas</CyberText>
                            <ul className="space-y-1">
                              {buildAnalystActions(result).map((action) => (
                                <li key={`analyst-${action}`}>
                                  <CyberText variant="caption">{action}</CyberText>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      }
                    />
                  </CardContent>
                </Card>

                {/* Compliance */}
                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="font-mono text-primary text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {isAnalystMode ? "COMPLIANCE REGULATÓRIO" : "Está dentro das regras? (Compliance)"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ModeStack
                      mode={mode}
                      popular={
                        <div className="space-y-2">
                          <CyberText variant="caption" color="muted">Leitura rápida</CyberText>
                          <CyberText className="font-mono font-bold">
                            {translateGlossaryText(result.compliance.regulatoryRegion, mode)}
                          </CyberText>
                          <CyberText variant="caption">
                            {translateGlossaryText(result.compliance.regulationNote, mode)}
                          </CyberText>
                          <CyberText variant="caption" className="block">
                            Nível: <GlossaryTerm term={`Compliance ${result.compliance.complianceRisk}`} mode={mode} />
                          </CyberText>
                        </div>
                      }
                      technical={
                        <div className="grid grid-cols-2 gap-4">
                          <DataField label="Região regulatória" value={result.compliance.regulatoryRegion} />
                          <DataField
                            label="Mandato 3DS"
                            value={result.compliance.threeDSMandateLevel}
                          />
                          <DataField
                            label="Risco de compliance"
                            value={result.compliance.complianceRisk}
                          />
                          <div className="col-span-2">
                            <CyberText variant="caption" color="muted">Nota regulatória</CyberText>
                            <CyberText variant="caption" className="leading-relaxed">
                              {translateGlossaryText(result.compliance.regulationNote, mode)}
                            </CyberText>
                          </div>
                        </div>
                      }
                    />
                  </CardContent>
                </Card>

                {/* Data Quality */}
                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="font-mono text-secondary text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      QUALIDADE DOS DADOS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ModeStack
                      mode={mode}
                      popular={
                        <div className="space-y-2">
                          <CyberText variant="caption" color="muted">Qualidade dos dados da análise</CyberText>
                          <CyberText className="font-mono font-bold text-xl text-secondary">
                            {result.dataQuality.score}%
                          </CyberText>
                          <CyberText variant="caption">
                            {result.dataQuality.missingFields.length > 0
                              ? `Faltam dados: ${result.dataQuality.missingFields.join(", ")}`
                              : "Sem dados ausentes ✅"}
                          </CyberText>
                        </div>
                      }
                      technical={
                        <>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <CyberText variant="caption" color="muted">Score de qualidade</CyberText>
                              <CyberText className="font-mono font-bold text-xl text-secondary">
                                {result.dataQuality.score}%
                              </CyberText>
                            </div>
                            <div>
                              <CyberText variant="caption" color="muted">Nível</CyberText>
                              <Badge
                                variant={
                                  result.dataQuality.level === "HIGH"
                                    ? "default"
                                    : result.dataQuality.level === "MEDIUM"
                                      ? "secondary"
                                      : "destructive"
                                }
                                className="font-mono mt-1"
                              >
                                {result.dataQuality.level}
                              </Badge>
                            </div>
                            <div>
                              <CyberText variant="caption" color="muted">Campos ausentes</CyberText>
                              <CyberText className="font-mono font-bold">
                                {result.dataQuality.missingFields.length > 0
                                  ? result.dataQuality.missingFields.join(", ")
                                  : "Nenhum"}
                              </CyberText>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <CyberText variant="caption" color="muted">Campos da API</CyberText>
                                <RealApiBadge />
                              </div>
                              <CyberText variant="caption">
                                {result.dataQuality.realApiFields.join(", ") || "—"}
                              </CyberText>
                            </div>
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <CyberText variant="caption" color="muted">Campos inferidos</CyberText>
                                <InferredBadge />
                              </div>
                              <CyberText variant="caption">
                                {result.dataQuality.inferredFields.join(", ")}
                              </CyberText>
                            </div>
                          </div>
                        </>
                      }
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ABA 4 — INTELIGÊNCIA/ADMIN */}
            <TabsContent value="admin">
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="font-mono text-accent text-sm flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    INTELIGÊNCIA INTERNA
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">
                    Dados de auditoria, histórico e overrides internos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <DataField label="Provedor de dados" value={result.source.provider} />
                    <DataField
                      label="Confiança da API"
                      value={result.source.apiConfidence}
                    />
                    <DataField
                      label="Dados brutos disponíveis"
                      value={result.source.rawDataAvailable ? "Sim" : "Não"}
                    />
                    <DataField
                      label="Análise inferida"
                      value={result.threeDSAnalysis.inferred ? "Sim" : "Não"}
                    />
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-md">
                    <CyberText variant="caption" className="text-blue-400">
                      Histórico completo de consultas, overrides manuais e exportação CSV disponíveis via painel administrativo.
                    </CyberText>
                  </div>

                  {/* JSON raw view */}
                  <div>
                    <CyberText variant="caption" color="muted" className="mb-2 block">
                      Dados brutos da análise (JSON)
                    </CyberText>
                    <pre className="p-4 bg-muted/20 border border-border rounded-md text-xs font-mono overflow-auto max-h-64 text-muted-foreground">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
