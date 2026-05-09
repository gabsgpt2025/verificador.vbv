'use client'

import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Clock3,
  Cpu,
  Globe2,
  History,
  Info,
  Inbox,
  MapPinned,
  Minus,
  Plus,
  ShieldQuestion,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  Zap,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { RiskIndicator } from '@/components/ui/risk-indicator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

import ConfidenceBadge from '@/components/premium-3-0/ConfidenceBadge'
import RiskRadarChart, { type RadarDimension } from '@/components/premium-3-0/RiskRadarChart'
import TransactionContextForm, {
  buildTransactionContextForRequest,
  type TransactionContextFormValue,
} from '@/components/premium-3-0/TransactionContextForm'
import { maskBin } from '@/lib/format'
import type { MastercardBinResult } from '@/lib/integrations/mastercard'
import { applyBinAutofill } from '@/lib/scoring/autofill'
import { getScoreDisplayPolicy, shouldMutePercentages, type DisplayConfidence } from '@/lib/scoring/displayPolicy'
import type { HolisticScore } from '@/lib/premium-3-0'
import type { AnalysisSourceSummary, MultiSourceConsensus, SourceDiagnostic } from '@/lib/premium-3-0/holisticTypes'
import type { PeerComparison } from '@/lib/premium-3-0/peerComparison'
import type { BinRiskFactor, FullBinAnalysis } from '@/lib/premium-3-0/types'
import { getRiskLevel } from '@/lib/risk'

const LANGUAGE_MODES = {
  technical: {
    label: 'Modo Técnico',
    description: 'Explicações com termos de risco, autenticação e contexto transacional.',
  },
  popular: {
    label: 'Modo Popular',
    description: 'Explicações curtas e simples para leitura rápida.',
  },
} as const

type LanguageModeKey = keyof typeof LANGUAGE_MODES

type ApiErrorPayload = {
  ok?: boolean
  error?: string | { code?: string; message?: string; requestId?: string }
}

type HistoryItem = {
  id: string
  bin: string
  brand?: string | null
  risk_score: number
  risk_level: string
  created_at: string
}

type HistoryResponse = {
  history?: HistoryItem[]
}

type PremiumAnalysisResponse = FullBinAnalysis & {
  holistic: HolisticScore
  peerComparison?: PeerComparison
  context: {
    amount?: number
    currency?: string
    merchantCountry?: string
    merchantCategoryCode?: string
    mcc?: string
    timestamp: number
    ipCountryCode?: string | null
    isFirstTransaction?: boolean | null
    userAgentPresent: boolean
  }
  sources?: {
    neutrino: AnalysisSourceSummary<FullBinAnalysis['technicalData']>
    mastercard: AnalysisSourceSummary<MastercardBinResult>
    binlist?: AnalysisSourceSummary<null>
  }
  consensus?: MultiSourceConsensus
  sourceDiagnostics?: SourceDiagnostic[]
  multiSource?: {
    sources?: {
      neutrino?: unknown
      mastercard?: unknown
      binlist?: unknown
    }
    consensus?: Partial<MultiSourceConsensus>
  }
}

type Premium3DAnalyzerProps = {
  initialAnalysis?: PremiumAnalysisResponse | null
  initialHistory?: HistoryItem[]
}

function formatDiscrepancyMessage(entry: string) {
  const trimmed = entry.trim()
  if (!trimmed.includes('mismatch:')) return trimmed

  const [labelPart, valuesPart] = trimmed.split('mismatch:', 2)
  const label = labelPart.trim().replace(/:$/, '')
  const normalizedValues = (valuesPart ?? '').trim().replace(/,/g, ' e')
  if (!normalizedValues) return label
  return `${label} diz ${normalizedValues}`
}

function getRiskTone(level: string) {
  switch (level) {
    case 'LOW':
      return 'border-primary/30 text-primary'
    case 'MEDIUM':
      return 'border-border text-foreground'
    case 'HIGH':
    case 'CRITICAL':
      return 'border-destructive/40 text-destructive'
    default:
      return 'border-border text-foreground'
  }
}

function getConfidenceTone(confidence: MultiSourceConsensus['confidence'] | undefined) {
  if (confidence === 'HIGH') return 'border-primary/30 text-primary'
  if (confidence === 'MEDIUM') return 'border-border text-foreground'
  return 'border-destructive/40 text-destructive'
}

function extractApiErrorMessage(payload: ApiErrorPayload | null, status: number) {
  if (!payload) return `Falha temporária na consulta do BIN (HTTP ${status}).`
  if (typeof payload.error === 'string') return payload.error
  if (payload.error?.message) return payload.error.message
  return `Falha temporária na consulta do BIN (HTTP ${status}).`
}

function formatImpact(impact: number) {
  return `${impact >= 0 ? '+' : ''}${impact}`
}

function formatFactorText(factor: BinRiskFactor, mode: LanguageModeKey) {
  if (mode === 'technical') return factor.reason
  if (factor.impact > 0) return `${factor.label}. Isso aumenta a atenção necessária nesta compra.`
  if (factor.impact < 0) return `${factor.label}. Isso ajuda a reduzir a suspeita geral.`
  return `${factor.label}. Esse ponto sozinho não muda muito o resultado.`
}

function riskSummary(score: number, mode: LanguageModeKey) {
  if (mode === 'technical') {
    if (score < 30) return 'Baixo risco'
    if (score < 60) return 'Risco moderado'
    return 'Risco elevado'
  }

  if (score < 30) return 'Situação mais tranquila'
  if (score < 60) return 'Vale acompanhar'
  return 'Precisa de bastante cuidado'
}

function clampPercentile(value: number) {
  return Math.min(Math.max(value, 0), 100)
}

function normalizeDisplayConfidence(confirmedSources: number, totalSources: number): DisplayConfidence {
  if (confirmedSources <= 0) return 'unavailable'
  const ratio = confirmedSources / Math.max(totalSources, 1)
  if (ratio >= 0.75) return 'high'
  if (ratio >= 0.5) return 'medium'
  return 'low'
}

function mapDisplayConfidenceToBadge(confidence: DisplayConfidence) {
  if (confidence === 'high') return 'HIGH' as const
  if (confidence === 'medium') return 'MEDIUM' as const
  if (confidence === 'low') return 'LOW' as const
  return 'UNAVAILABLE' as const
}

function formatSourceStatus(status: SourceDiagnostic['status']) {
  if (status === 'ok') return 'OK'
  if (status === 'timeout') return 'timeout'
  if (status === 'disabled') return 'desabilitada'
  if (status === 'not_applicable') return 'não aplicável'
  return 'erro'
}

function capitalizeWords(label: string) {
  return label
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getFactorSource(factor: BinRiskFactor) {
  const source =
    (factor as BinRiskFactor & { source?: string; dataSource?: string }).source ??
    (factor as BinRiskFactor & { source?: string; dataSource?: string }).dataSource
  return source ? source.trim() : null
}

function getFactorIcon(impact: number) {
  if (impact > 0) {
    return { Icon: Plus, className: 'text-risk-high', label: 'Fator aumenta risco' }
  }
  if (impact < 0) {
    return { Icon: Minus, className: 'text-status-success', label: 'Fator reduz risco' }
  }
  return { Icon: Info, className: 'text-status-info', label: 'Fator neutro' }
}

function toRelativeTime(dateString: string) {
  const parsed = new Date(dateString)
  if (Number.isNaN(parsed.getTime())) return 'data inválida'
  return formatDistanceToNow(parsed, { addSuffix: true, locale: ptBR })
}

export function buildAnalysisRequestBody(bin: string, contextValues: TransactionContextFormValue) {
  const context = buildTransactionContextForRequest(contextValues)
  return {
    bin,
    context: {
      ...context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      timestamp: Date.now(),
      timezoneOffset: new Date().getTimezoneOffset(),
    },
  }
}

export function Premium3DAnalyzer({ initialAnalysis = null, initialHistory = [] }: Premium3DAnalyzerProps) {
  const router = useRouter()
  const [languageMode, setLanguageMode] = useState<LanguageModeKey>('popular')
  const [cardNumber, setCardNumber] = useState('')
  const [contextValues, setContextValues] = useState<TransactionContextFormValue>({
    amount: '',
    currency: '',
    merchantCountry: '',
    mcc: '',
    isFirstTransaction: true,
  })
  const [suggestedCurrency, setSuggestedCurrency] = useState('')
  const [suggestedMerchantCountry, setSuggestedMerchantCountry] = useState('')
  const [userEditedCurrency, setUserEditedCurrency] = useState(false)
  const [userEditedMerchantCountry, setUserEditedMerchantCountry] = useState(false)
  const [analysis, setAnalysis] = useState<PremiumAnalysisResponse | null>(initialAnalysis)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory)
  const [historyLoading, setHistoryLoading] = useState(initialHistory.length === 0)
  const [historyMessage, setHistoryMessage] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryMessage(null)

    try {
      const response = await fetch('/api/history?limit=10')

      if (response.status === 401) {
        setHistory([])
        setHistoryMessage('Faça login para ver seu histórico recente de análises.')
        return
      }

      const payload = (await response.json().catch(() => ({}))) as HistoryResponse
      const items = payload.history ?? []
      setHistory(items)
      setHistoryMessage(items.length === 0 ? 'Nenhuma análise recente disponível ainda.' : null)
    } catch (fetchError) {
      console.error('[Premium3DAnalyzer] Erro ao carregar histórico', fetchError)
      setHistory([])
      setHistoryMessage('Não foi possível carregar o histórico agora.')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchHistory()
  }, [fetchHistory])

  const handleContextChange = useCallback((next: TransactionContextFormValue) => {
    if (next.currency !== contextValues.currency && suggestedCurrency && next.currency !== suggestedCurrency) {
      setUserEditedCurrency(true)
    }

    if (next.merchantCountry !== contextValues.merchantCountry && suggestedMerchantCountry && next.merchantCountry !== suggestedMerchantCountry) {
      setUserEditedMerchantCountry(true)
    }

    setContextValues(next)
  }, [contextValues, suggestedCurrency, suggestedMerchantCountry])

  const analyzeBin = useCallback(async (inputBin?: string) => {
    const cleanBin = (inputBin ?? cardNumber).replace(/\D/g, '').slice(0, 8)

    if (!cleanBin || cleanBin.length < 6) {
      setError('Por favor, insira pelo menos os 6 primeiros dígitos do cartão.')
      return
    }

    if (contextValues.amount.trim()) {
      const parsed = Number(contextValues.amount.replace(',', '.'))
      if (Number.isNaN(parsed)) {
        setError('Informe um valor numérico válido para a transação.')
        return
      }
    }

    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const response = await fetch('/api/bin-analysis-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAnalysisRequestBody(cleanBin, contextValues)),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null
        const errorCode = typeof payload?.error === 'string' ? undefined : payload?.error?.code
        if (errorCode === 'INSUFFICIENT_CREDITS') {
          toast.warning('Crédito insuficiente', {
            action: {
              label: 'Ir para créditos',
              onClick: () => router.push('/dashboard/credits'),
            },
          })
        } else {
          toast.error('Falha na análise. Tente novamente.')
        }
        throw new Error(extractApiErrorMessage(payload, response.status))
      }

      const payload = (await response.json()) as PremiumAnalysisResponse
      setAnalysis(payload)
      setCardNumber(cleanBin)

      const autofill = applyBinAutofill({
        context: contextValues,
        issuerCountryCode: payload.technicalData.countryCode,
        issuerCurrencyCode: payload.technicalData.currency,
        userEditedCurrency,
        userEditedMerchantCountry,
      })
      setContextValues(autofill.value)
      setSuggestedCurrency(autofill.suggestedCurrency ?? '')
      setSuggestedMerchantCountry(autofill.suggestedMerchantCountry ?? '')
      if (autofill.currencySuggested) setUserEditedCurrency(false)
      if (autofill.merchantCountrySuggested) setUserEditedMerchantCountry(false)
      toast.success('Análise concluída')
      void fetchHistory()
    } catch (analyzeError) {
      setError(analyzeError instanceof Error ? analyzeError.message : 'Erro ao analisar o cartão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [cardNumber, contextValues, fetchHistory, router, userEditedCurrency, userEditedMerchantCountry])

  const riskDimensions = useMemo(() => {
    if (!analysis) return [] as RadarDimension[]

    return [
      { key: 'binRisk', label: 'BIN', score: analysis.holistic.binRisk.score, dataAvailable: analysis.holistic.binRisk.dataAvailable },
      { key: 'geographicRisk', label: 'Geográfico', score: analysis.holistic.geographicRisk.score, dataAvailable: analysis.holistic.geographicRisk.dataAvailable },
      { key: 'behavioralRisk', label: 'Comportamental', score: analysis.holistic.behavioralRisk.score, dataAvailable: analysis.holistic.behavioralRisk.dataAvailable },
      { key: 'gatewayRisk', label: 'Gateway', score: analysis.holistic.gatewayRisk.score, dataAvailable: analysis.holistic.gatewayRisk.dataAvailable },
      { key: 'temporalRisk', label: 'Temporal', score: analysis.holistic.temporalRisk.score, dataAvailable: analysis.holistic.temporalRisk.dataAvailable },
      { key: 'deviceRisk', label: 'Dispositivo', score: analysis.holistic.deviceRisk.score, dataAvailable: analysis.holistic.deviceRisk.dataAvailable },
    ] satisfies RadarDimension[]
  }, [analysis])

  const consensus = analysis?.consensus ?? (analysis?.multiSource?.consensus as MultiSourceConsensus | undefined)
  const peerComparison = analysis?.peerComparison ?? analysis?.holistic.peerComparison

  const sourceAvailability = {
    neutrino: analysis?.sources?.neutrino.available ?? false,
    mastercard: analysis?.sources?.mastercard.available ?? false,
    binlist: analysis?.sources?.binlist?.available ?? false,
  }

  const confirmedSources = consensus?.sourcesConfirmed ?? Object.values(sourceAvailability).filter(Boolean).length
  const totalSources = consensus?.sourcesTotal ?? 3
  const displayConfidence = normalizeDisplayConfidence(confirmedSources, totalSources)
  const scoreDisplayPolicy = analysis
    ? getScoreDisplayPolicy({
      score: analysis.holistic.overallScore,
      confidence: displayConfidence,
      sourcesConfirmed: confirmedSources,
      sourcesTotal: totalSources,
    })
    : null
  const muteSubPercentages = scoreDisplayPolicy ? shouldMutePercentages(scoreDisplayPolicy.precision) : false
  const sourceDiagnostics = analysis?.sourceDiagnostics ?? []
  const degradationMode = confirmedSources < totalSources

  const aboutBinText = analysis
    ? `O BIN ${analysis.bin} pertence a ${analysis.technicalData.issuer ?? 'emissor não informado'} (${analysis.technicalData.countryName ?? analysis.technicalData.countryCode ?? 'país não informado'}), bandeira ${analysis.technicalData.brand ?? 'não informada'}, cartão ${analysis.technicalData.type ?? 'tipo não informado'}. Para uma transação de ${analysis.context.amount ? `${(analysis.context.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${analysis.context.currency ?? ''}` : 'valor não informado'} num merchant no ${analysis.context.merchantCountry ?? 'país não informado'} (categoria ${analysis.context.mcc ?? 'não informada'}), o motor identificou ${scoreDisplayPolicy?.displayValue ?? 'resultado indisponível'} com base em ${confirmedSources} de ${totalSources} fontes confirmadas.${displayConfidence !== 'high' ? ' A análise é preliminar e pode mudar com novas fontes.' : ''}`
    : ''

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10 font-sans text-fg">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-surface px-4 py-2 text-sm text-fg-muted">
          <Zap className="h-4 w-4 text-ds-accent" aria-hidden="true" />
          VeriFiBIN Premium 3.0
        </div>
        <h1 className="text-2xl font-bold text-fg">Motor Holístico Multidimensional</h1>
        <p className="text-sm text-fg-muted">Análise 6D com contexto transacional, múltiplas fontes e explicações em dois modos.</p>
      </div>

      <Card variant="surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Globe2 className="h-5 w-5 text-ds-accent" aria-hidden="true" />
            Modo de explicação
          </CardTitle>
          <CardDescription>{LANGUAGE_MODES[languageMode].description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Tabs value={languageMode} onValueChange={(value) => setLanguageMode(value as LanguageModeKey)} className="w-fit">
            <TabsList>
              <TabsTrigger value="popular">
                <Users className="mr-2 h-4 w-4" aria-hidden="true" />
                Modo Popular
              </TabsTrigger>
              <TabsTrigger value="technical">
                <Wrench className="mr-2 h-4 w-4" aria-hidden="true" />
                Modo Técnico
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Card variant="surface">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Analisar BIN com contexto</CardTitle>
          <CardDescription>Preencha o BIN e, se quiser, complemente com contexto transacional opcional.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              type="text"
              placeholder="BIN (6 a 8 dígitos)"
              value={cardNumber}
              onChange={(event) => setCardNumber(event.target.value.replace(/\D/g, '').slice(0, 8))}
              maxLength={8}
              className="text-sm"
              aria-describedby="bin-validation-message"
            />
            <Button onClick={() => void analyzeBin()} disabled={loading} loading={loading} loadingText="Analisando..." aria-busy={loading}>
              Analisar
            </Button>
          </div>
          <p id="bin-validation-message" className="text-xs text-fg-muted">
            Informe entre 6 e 8 dígitos para análise.
          </p>

          <TransactionContextForm
            value={contextValues}
            onChange={handleContextChange}
            suggestedCurrency={suggestedCurrency}
            suggestedMerchantCountry={suggestedMerchantCountry}
            issuerCountryCode={analysis?.technicalData.countryCode}
          />

          {error ? (
            <Alert variant="destructive">
              <AlertTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                Falha na análise
              </AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{error}</p>
                <Button type="button" variant="destructive" size="sm" onClick={() => void analyzeBin()}>
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <div aria-live="polite">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Card key={item} variant="surface">
                <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                <CardContent><Skeleton className="h-24 w-full" /></CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {!loading && !analysis ? (
          <EmptyState
            icon={<ShieldQuestion className="h-8 w-8" />}
            title="Pronto para analisar"
            description="Digite um BIN acima para iniciar a análise multidimensional"
          />
        ) : null}

        {analysis ? (
        <div className="space-y-6">
          {degradationMode ? (
            <div className="sticky top-4 z-20 rounded-lg border border-status-warning/40 bg-status-warning/10 p-4">
              <p className="text-sm font-medium text-status-warning">
                ⚠️ Análise em modo parcial — {confirmedSources} de {totalSources} fontes respondeu.
              </p>
              <p className="mt-1 text-xs text-fg-muted">A precisão dos scores está reduzida.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => void analyzeBin()}>Tentar novamente</Button>
                <Dialog>
                  <DialogTrigger>
                    <Button size="sm" variant="outline">Ver detalhes</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Status técnico das fontes</DialogTitle>
                      <DialogDescription>Detalhes sanitizados para troubleshooting operacional.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 text-sm">
                      {sourceDiagnostics.map((diagnostic) => (
                        <div key={diagnostic.source} className="rounded-md border border-border-subtle p-3">
                          <p className="font-medium">{diagnostic.source} — {formatSourceStatus(diagnostic.status)}</p>
                          <p className="text-xs text-fg-muted">HTTP {diagnostic.httpStatus ?? 'n/a'} · latência {diagnostic.latencyMs ?? 'n/a'}ms</p>
                          <p className="mt-1 text-xs">{diagnostic.message}</p>
                          {diagnostic.missingEnvVars && diagnostic.missingEnvVars.length > 0 ? (
                            <p className="mt-1 text-xs text-status-warning">Env ausentes: {diagnostic.missingEnvVars.join(', ')}</p>
                          ) : null}
                          {diagnostic.suggestedAction ? <p className="mt-1 text-xs">Ação sugerida: {diagnostic.suggestedAction}</p> : null}
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                <a className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm hover:bg-bg-surface-hover" href="mailto:suporte@verifibin.local?subject=Reportar%20degrada%C3%A7%C3%A3o">Reportar</a>
              </div>
            </div>
          ) : null}

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Sobre este BIN</CardTitle>
              <CardDescription>Resumo textual determinístico com rastreabilidade das afirmações.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-fg-muted">{aboutBinText}</p>
              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Badge variant="outline">BIN / emissor</Badge></TooltipTrigger>
                    <TooltipContent>Fonte: technicalData (Neutrino/Mastercard).</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger><Badge variant="outline">Contexto transação</Badge></TooltipTrigger>
                    <TooltipContent>Fonte: dados enviados no contexto avançado.</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger><Badge variant="outline">Score</Badge></TooltipTrigger>
                    <TooltipContent>Fonte: motor holístico + política de exibição.</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-4">
            <Card className={`border ${getRiskTone(analysis.holistic.riskLevel)}`}>
              <CardHeader>
                <CardDescription>Score geral</CardDescription>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-2xl font-bold">{scoreDisplayPolicy?.displayValue ?? `${analysis.holistic.overallScore}/100`}</CardTitle>
                  <Dialog>
                  <DialogTrigger>
                    <Button size="sm" variant="outline">
                      <Info className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                      Como calculamos isto?
                    </Button>
                  </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Score geral — metodologia</DialogTitle>
                        <DialogDescription>Fórmula simplificada, contribuições e fontes reais usadas.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 text-sm">
                        <div className="rounded-md border border-border-subtle bg-bg-surface-elevated p-3">
                          <p className="font-medium">Score = 0.3*BIN + 0.2*Geo + 0.15*Comportamental + 0.1*Temporal + 0.15*Dispositivo + 0.1*Gateway</p>
                        </div>
                        <div className="overflow-auto rounded-md border border-border-subtle">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-bg-surface-elevated text-fg-muted">
                              <tr>
                                <th className="px-2 py-2">Fator</th>
                                <th className="px-2 py-2">Peso</th>
                                <th className="px-2 py-2">Valor</th>
                                <th className="px-2 py-2">Contribuição</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { label: 'BIN', weight: analysis.holistic.binRisk.weight, value: analysis.holistic.binRisk.score },
                                { label: 'Geo', weight: analysis.holistic.geographicRisk.weight, value: analysis.holistic.geographicRisk.score },
                                { label: 'Comportamental', weight: analysis.holistic.behavioralRisk.weight, value: analysis.holistic.behavioralRisk.score },
                                { label: 'Temporal', weight: analysis.holistic.temporalRisk.weight, value: analysis.holistic.temporalRisk.score },
                                { label: 'Dispositivo', weight: analysis.holistic.deviceRisk.weight, value: analysis.holistic.deviceRisk.score },
                                { label: 'Gateway', weight: analysis.holistic.gatewayRisk.weight, value: analysis.holistic.gatewayRisk.score },
                              ].map((factor) => (
                                <tr key={factor.label} className="border-t border-border-subtle">
                                  <td className="px-2 py-2">{factor.label}</td>
                                  <td className="px-2 py-2">{factor.weight}</td>
                                  <td className="px-2 py-2">{factor.value}</td>
                                  <td className="px-2 py-2">{Math.round(factor.value * factor.weight)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="rounded-md border border-border-subtle bg-bg-surface-elevated p-3 text-xs">
                          <p className="font-medium">Fontes usadas</p>
                          <ul className="mt-2 space-y-1">
                            {sourceDiagnostics.map((diagnostic) => (
                              <li key={diagnostic.source}>
                                {diagnostic.source}: {formatSourceStatus(diagnostic.status)} · HTTP {diagnostic.httpStatus ?? 'n/a'} · {diagnostic.latencyMs ?? 'n/a'}ms
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2">Versão do ruleset: engine v3.2.0 / ruleset v12</p>
                          <a href="/metodologia" className="text-ds-accent underline">Ver metodologia completa</a>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline" className="border-current text-current">{analysis.holistic.riskLevel}</Badge>
                <ConfidenceBadge confidence={mapDisplayConfidenceToBadge(displayConfidence)} />
                {scoreDisplayPolicy?.warning ? <p className="text-xs text-fg-muted">{scoreDisplayPolicy.warning}</p> : null}
                <RiskIndicator
                  level={getRiskLevel(analysis.holistic.overallScore)}
                  score={analysis.holistic.overallScore}
                  size="sm"
                  tooltip="Pontuação consolidada do radar 6D."
                />
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardDescription>Frictionless</CardDescription>
                <CardTitle className="text-2xl font-bold">{muteSubPercentages ? 'Estimativa preliminar' : `${analysis.threeDSAnalysis.frictionlessProbability}%`}</CardTitle>
              </CardHeader>
              <CardContent className={muteSubPercentages ? 'opacity-60' : ''}>
                {muteSubPercentages ? <p className="text-xs text-fg-muted">Precisão exata oculta devido à confiança baixa.</p> : <Progress value={analysis.threeDSAnalysis.frictionlessProbability} />}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardDescription>Challenge 3DS</CardDescription>
                <CardTitle className="text-2xl font-bold">{muteSubPercentages ? 'Estimativa preliminar' : `${analysis.threeDSAnalysis.challengeProbability}%`}</CardTitle>
              </CardHeader>
              <CardContent className={muteSubPercentages ? 'opacity-60' : ''}>
                {muteSubPercentages ? <p className="text-xs text-fg-muted">Precisão exata oculta devido à confiança baixa.</p> : <Progress value={analysis.threeDSAnalysis.challengeProbability} />}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardDescription>Bypass aplicável</CardDescription>
                <CardTitle className="text-2xl font-bold">{muteSubPercentages ? 'Estimativa preliminar' : `${analysis.threeDSAnalysis.bypassProbability}%`}</CardTitle>
              </CardHeader>
              <CardContent className={`flex flex-wrap gap-2 ${muteSubPercentages ? 'opacity-60' : ''}`}>
                {analysis.threeDSAnalysis.applicableBypassMechanisms.length > 0 ? (
                  analysis.threeDSAnalysis.applicableBypassMechanisms.map((mechanism) => (
                    <Badge key={mechanism} variant="outline">{mechanism}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Nenhum mecanismo favorável detectado.</span>
                )}
              </CardContent>
            </Card>
          </div>

          {(analysis.sources || analysis.consensus || analysis.multiSource) ? (
            <Card className={`border ${getConfidenceTone(consensus?.confidence)}`}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Multi-Source Consensus</CardTitle>
                <CardDescription>Dados confirmados por {confirmedSources} de {totalSources} fontes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={sourceAvailability.neutrino ? 'border-primary/40 text-primary' : 'text-muted-foreground'}>
                    Neutrino {sourceAvailability.neutrino ? '✓' : '—'}
                  </Badge>
                  <Badge variant="outline" className={sourceAvailability.mastercard ? 'border-primary/40 text-primary' : 'text-muted-foreground'}>
                    Mastercard {sourceAvailability.mastercard ? '✓' : '—'}
                  </Badge>
                  <Badge variant="outline" className={sourceAvailability.binlist ? 'border-primary/40 text-primary' : 'text-muted-foreground'}>
                    BinList {sourceAvailability.binlist ? '✓' : '—'}
                  </Badge>
                  <ConfidenceBadge confidence={mapDisplayConfidenceToBadge(displayConfidence)} />
                </div>

                {consensus?.discrepancies && consensus.discrepancies.length > 0 ? (
                  <ul className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {consensus.discrepancies.map((entry) => (
                      <li key={entry} className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-risk-high" aria-hidden="true" />
                        {formatDiscrepancyMessage(entry)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {peerComparison ? (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Comparação com Pares</CardTitle>
                <CardDescription>{peerComparison.percentile > 50 ? 'Top de risco mais alto na coorte.' : 'Posição favorável na coorte.'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Percentil de risco: {clampPercentile(peerComparison.percentile)}/100 entre BINs comparáveis</p>
                  {peerComparison.percentile > 50 ? (
                    <TrendingUp className="h-5 w-5 text-destructive" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-primary" aria-hidden="true" />
                  )}
                </div>
                <Progress value={peerComparison.percentile} />
                <p className="text-sm text-muted-foreground">{peerComparison.description}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Análise Detalhada de Fatores de Risco</CardTitle>
              <CardDescription>Radar 6D consolidado e fatores explicáveis por dimensão.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RiskIndicator
                level={getRiskLevel(analysis.holistic.overallScore)}
                score={analysis.holistic.overallScore}
                variant="card"
                tooltip="Pontuação calculada a partir da composição das dimensões de risco do BIN identificado."
              />
              <RiskRadarChart dimensions={riskDimensions} overallScore={analysis.holistic.overallScore} />

              <Accordion type="multiple" className="w-full">
                {[
                  { key: 'binRisk', label: 'Risco de BIN', icon: Shield, value: analysis.holistic.binRisk },
                  { key: 'geographicRisk', label: 'Risco Geográfico', icon: MapPinned, value: analysis.holistic.geographicRisk },
                  { key: 'behavioralRisk', label: 'Risco Comportamental', icon: Target, value: analysis.holistic.behavioralRisk },
                  { key: 'gatewayRisk', label: 'Risco de Gateway', icon: Wallet, value: analysis.holistic.gatewayRisk },
                  { key: 'temporalRisk', label: 'Risco Temporal', icon: Clock3, value: analysis.holistic.temporalRisk },
                  { key: 'deviceRisk', label: 'Risco de Dispositivo', icon: Cpu, value: analysis.holistic.deviceRisk },
                ].map((dimension) => {
                  const Icon = dimension.icon
                  const dimExplanation = languageMode === 'technical'
                    ? dimension.value.explanation.technical
                    : dimension.value.explanation.popular

                  return (
                    <AccordionItem key={dimension.key} value={dimension.key}>
                      <AccordionTrigger>
                        <div className="flex w-full items-center justify-between gap-3 pr-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-ds-accent" aria-hidden="true" />
                            <div className="text-left">
                              <p className="text-sm font-semibold">{dimension.label}</p>
                              <p className="text-xs text-fg-muted">{riskSummary(dimension.value.score, languageMode)}</p>
                            </div>
                          </div>
                          <RiskIndicator
                            level={getRiskLevel(dimension.value.score)}
                            score={dimension.value.score}
                            size="sm"
                            tooltip={`Pontuação calculada para ${dimension.label}.`}
                          />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p className="text-sm text-fg-muted">{dimExplanation}</p>
                        <Progress value={dimension.value.score} />
                        <ul className="space-y-2">
                          {dimension.value.factors.map((factor, index) => (
                            <li key={`${dimension.key}-${index}`} className="rounded-md border border-border bg-background p-3">
                              {(() => {
                                const source = getFactorSource(factor)
                                const { Icon: FactorIcon, className, label } = getFactorIcon(factor.impact)
                                return (
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span>
                                                <FactorIcon className={`h-4 w-4 ${className}`} aria-label={label} />
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent>{formatFactorText(factor, languageMode)}</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                        <p className="text-sm font-medium">{capitalizeWords(factor.label)}</p>
                                        {source ? <Badge variant="info">{source}</Badge> : null}
                                      </div>
                                  <p className="text-xs text-fg-muted">{formatFactorText(factor, languageMode)}</p>
                                </div>
                                <span className={`text-sm font-semibold ${factor.impact > 0 ? 'text-destructive' : factor.impact < 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                  {formatImpact(factor.impact)}
                                </span>
                                  </div>
                                )
                              })()}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
          </Card>

            <Card variant="surface">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Resumo técnico do BIN</CardTitle>
              </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs">Emissor</p>
                  <p className="text-foreground">{analysis.technicalData.issuer ?? 'Não informado'}</p>
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs">País</p>
                  <p className="text-foreground">{analysis.technicalData.countryName ?? analysis.technicalData.countryCode ?? 'Não informado'}</p>
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs">Bandeira</p>
                  <p className="text-foreground">{analysis.technicalData.brand ?? 'Não informada'}</p>
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs">Categoria</p>
                  <p className="text-foreground">{analysis.technicalData.category ?? 'Não informada'}</p>
                </div>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-xs">Contexto resolvido</p>
                <p className="text-foreground">
                  {analysis.context.amount ? `${(analysis.context.amount / 100).toFixed(2)} ${analysis.context.currency}` : 'Sem valor informado'} ·{' '}
                  {analysis.context.merchantCountry ?? analysis.context.ipCountryCode ?? 'País não informado'} · MCC: {analysis.context.mcc ?? analysis.context.merchantCategoryCode ?? 'N/A'}
                </p>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-xs">Explicação 3DS</p>
                <p className="text-foreground">{languageMode === 'technical' ? analysis.threeDSAnalysis.explanation.technical : analysis.threeDSAnalysis.explanation.popular}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <History className="h-5 w-5 text-primary" aria-hidden="true" />
            Histórico de análises
          </CardTitle>
          <CardDescription>Últimas 10 análises carregadas do endpoint real.</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="space-y-3 rounded-xl border border-dashed border-border bg-background p-6 text-center">
              <Inbox className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">{historyMessage ?? 'Nenhum registro disponível no momento.'}</p>
              <p className="text-sm font-medium text-foreground">Faça sua primeira análise</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => void analyzeBin(entry.bin)}
                  disabled={loading}
                  className="flex w-full flex-col gap-3 rounded-xl border border-border bg-background p-4 text-left transition hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-mono text-sm text-foreground">{maskBin(entry.bin)}</p>
                    <p className="text-xs text-muted-foreground">{toRelativeTime(entry.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {entry.brand ? <Badge variant="outline">{entry.brand}</Badge> : null}
                    <Badge variant="outline" className={getRiskTone(entry.risk_level)}>{entry.risk_level}</Badge>
                    <span className="text-sm text-muted-foreground">{entry.risk_score}/100</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Premium3DAnalyzer
