'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Clock3,
  Cpu,
  Globe2,
  History,
  Inbox,
  MapPinned,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

import RiskRadarChart, { type RadarDimension } from '@/components/premium-3-0/RiskRadarChart'
import TransactionContextForm, {
  buildTransactionContextForRequest,
  type TransactionContextFormValue,
} from '@/components/premium-3-0/TransactionContextForm'
import type { MastercardBinResult } from '@/lib/integrations/mastercard'
import type { HolisticScore } from '@/lib/premium-3-0'
import type { AnalysisSourceSummary, MultiSourceConsensus } from '@/lib/premium-3-0/holisticTypes'
import type { PeerComparison } from '@/lib/premium-3-0/peerComparison'
import type { BinRiskFactor, FullBinAnalysis } from '@/lib/premium-3-0/types'

const LANGUAGE_MODES = {
  TECHNICAL: {
    label: '🔧 Modo Técnico',
    description: 'Explicações com termos de risco, autenticação e contexto transacional.',
  },
  POPULAR: {
    label: '👥 Modo Popular',
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
  }
  consensus?: MultiSourceConsensus
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
  if (mode === 'TECHNICAL') return factor.reason
  if (factor.impact > 0) return `${factor.label}. Isso aumenta a atenção necessária nesta compra.`
  if (factor.impact < 0) return `${factor.label}. Isso ajuda a reduzir a suspeita geral.`
  return `${factor.label}. Esse ponto sozinho não muda muito o resultado.`
}

function riskSummary(score: number, mode: LanguageModeKey) {
  if (mode === 'TECHNICAL') {
    if (score < 30) return 'Baixo risco'
    if (score < 60) return 'Risco moderado'
    return 'Risco elevado'
  }

  if (score < 30) return 'Situação mais tranquila'
  if (score < 60) return 'Vale acompanhar'
  return 'Precisa de bastante cuidado'
}

function toRelativeTime(dateValue: string) {
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return 'agora'
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
  const [languageMode, setLanguageMode] = useState<LanguageModeKey>('TECHNICAL')
  const [cardNumber, setCardNumber] = useState('')
  const [contextValues, setContextValues] = useState<TransactionContextFormValue>({
    amount: '',
    currency: 'BRL',
    merchantCountry: 'OUTROS',
    mcc: '',
    isFirstTransaction: true,
  })
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
        throw new Error(extractApiErrorMessage(payload, response.status))
      }

      const payload = (await response.json()) as PremiumAnalysisResponse
      setAnalysis(payload)
      setCardNumber(cleanBin)
      void fetchHistory()
    } catch (analyzeError) {
      setError(analyzeError instanceof Error ? analyzeError.message : 'Erro ao analisar o cartão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [cardNumber, contextValues, fetchHistory])

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
    neutrino: analysis?.sources?.neutrino.available ?? Boolean(analysis?.multiSource?.sources?.neutrino),
    mastercard: analysis?.sources?.mastercard.available ?? Boolean(analysis?.multiSource?.sources?.mastercard),
    binlist: Boolean(analysis?.multiSource?.sources?.binlist),
  }

  const confirmedSources = Object.values(sourceAvailability).filter(Boolean).length

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10 text-foreground">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4 text-primary" />
          VeriFiBIN Premium 3.0
        </div>
        <h1 className="text-2xl font-bold">Motor holístico multidimensional</h1>
        <p className="text-sm text-muted-foreground">Análise 6D com contexto transacional, múltiplas fontes e explicações em dois modos.</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Globe2 className="h-5 w-5 text-primary" />
            Modo de explicação
          </CardTitle>
          <CardDescription>{LANGUAGE_MODES[languageMode].description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          {(Object.keys(LANGUAGE_MODES) as LanguageModeKey[]).map((mode) => (
            <Button
              key={mode}
              type="button"
              variant={languageMode === mode ? 'default' : 'outline'}
              onClick={() => setLanguageMode(mode)}
            >
              {LANGUAGE_MODES[mode].label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
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
            />
            <Button onClick={() => void analyzeBin()} disabled={loading}>
              {loading ? 'Analisando...' : 'Analisar'}
            </Button>
          </div>

          <TransactionContextForm value={contextValues} onChange={setContextValues} />

          {error ? (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {loading ? (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Analisando BIN...</CardTitle>
            <CardDescription>Consolidando sinais holísticos e fontes externas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-72 w-full" />
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={`line-${index}`} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {analysis ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-4">
            <Card className={`border ${getRiskTone(analysis.holistic.riskLevel)}`}>
              <CardHeader>
                <CardDescription>Score geral</CardDescription>
                <CardTitle className="text-2xl font-bold">{analysis.holistic.overallScore}/100</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="border-current text-current">{analysis.holistic.riskLevel}</Badge>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardDescription>Frictionless</CardDescription>
                <CardTitle className="text-2xl font-bold">{analysis.threeDSAnalysis.frictionlessProbability}%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={analysis.threeDSAnalysis.frictionlessProbability} />
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardDescription>Challenge 3DS</CardDescription>
                <CardTitle className="text-2xl font-bold">{analysis.threeDSAnalysis.challengeProbability}%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={analysis.threeDSAnalysis.challengeProbability} />
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardDescription>Bypass aplicável</CardDescription>
                <CardTitle className="text-2xl font-bold">{analysis.threeDSAnalysis.bypassProbability}%</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
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
                <CardDescription>Dados confirmados por {confirmedSources} de 3 fontes.</CardDescription>
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
                  <Badge variant="outline" className={getConfidenceTone(consensus?.confidence)}>
                    Confiança: {consensus?.confidence ?? 'LOW'}
                  </Badge>
                </div>

                {consensus?.discrepancies && consensus.discrepancies.length > 0 ? (
                  <ul className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {consensus.discrepancies.map((entry) => (
                      <li key={entry}>⚠️ {entry.replace('mismatch:', 'diz')}</li>
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
                  <p className="text-sm text-muted-foreground">Top {Math.max(1, 100 - peerComparison.percentile)}% de risco entre BINs comparáveis</p>
                  {peerComparison.percentile > 50 ? (
                    <TrendingUp className="h-5 w-5 text-destructive" aria-label="Tendência de risco acima da média" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-primary" aria-label="Tendência de risco abaixo da média" />
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
                  const dimExplanation = languageMode === 'TECHNICAL'
                    ? dimension.value.explanation.technical
                    : dimension.value.explanation.popular

                  return (
                    <AccordionItem key={dimension.key} value={dimension.key}>
                      <AccordionTrigger>
                        <div className="flex w-full items-center justify-between gap-3 pr-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary" />
                            <div className="text-left">
                              <p className="text-sm font-semibold">{dimension.label}</p>
                              <p className="text-xs text-muted-foreground">{riskSummary(dimension.value.score, languageMode)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{dimension.value.score}/100</p>
                            <p className="text-xs text-muted-foreground">
                              {dimension.value.dataAvailable ? 'Dados disponíveis' : 'Dados parciais'}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{dimExplanation}</p>
                        <Progress value={dimension.value.score} />
                        <ul className="space-y-2">
                          {dimension.value.factors.map((factor, index) => (
                            <li key={`${dimension.key}-${index}`} className="rounded-md border border-border bg-background p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium">{factor.label}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">{formatFactorText(factor, languageMode)}</p>
                                </div>
                                <span className={`text-sm font-semibold ${factor.impact > 0 ? 'text-destructive' : factor.impact < 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                  {formatImpact(factor.impact)}
                                </span>
                              </div>
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

          <Card className="border-border bg-card">
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
                <p className="text-foreground">{languageMode === 'TECHNICAL' ? analysis.threeDSAnalysis.explanation.technical : analysis.threeDSAnalysis.explanation.popular}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <History className="h-5 w-5 text-primary" />
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
              <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
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
                    <p className="font-mono text-sm text-foreground">{entry.bin}</p>
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
