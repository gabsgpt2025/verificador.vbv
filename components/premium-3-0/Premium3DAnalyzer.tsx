'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock3, Cpu, Globe2, History, MapPinned, Shield, Target, Wallet, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { HolisticRiskAnalysis } from '@/lib/premium-3-0'
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
  holistic: HolisticRiskAnalysis
  peerComparison: PeerComparison
  context: {
    amount?: number
    currency?: string
    merchantCountry?: string
    mcc?: string
    timestamp: number
    ipCountryCode?: string | null
    isFirstTransaction?: boolean | null
    userAgentPresent: boolean
  }
}

function deriveDeviceType(userAgent: string) {
  if (/ipad|tablet|kindle/i.test(userAgent)) return 'TABLET'
  if (/android|iphone|mobile/i.test(userAgent)) return 'MOBILE'
  return 'DESKTOP'
}

function extractApiErrorMessage(payload: ApiErrorPayload | null, status: number) {
  if (!payload) {
    return `Falha temporária na consulta do BIN (HTTP ${status}).`
  }

  if (typeof payload.error === 'string') {
    return payload.error
  }

  if (payload.error?.message) {
    return payload.error.message
  }

  return `Falha temporária na consulta do BIN (HTTP ${status}).`
}

function formatImpact(impact: number) {
  return `${impact >= 0 ? '+' : ''}${impact}`
}

function formatFactorText(factor: BinRiskFactor, mode: LanguageModeKey) {
  if (mode === 'TECHNICAL') {
    return factor.reason
  }

  if (factor.impact > 0) {
    return `${factor.label}. Isso aumenta a atenção necessária nesta compra.`
  }

  if (factor.impact < 0) {
    return `${factor.label}. Isso ajuda a reduzir a suspeita geral.`
  }

  return `${factor.label}. Esse ponto sozinho não muda muito o resultado.`
}

function getRiskColor(level: string) {
  switch (level) {
    case 'LOW':
      return 'text-emerald-300 border-emerald-500/30 bg-emerald-950/30'
    case 'MEDIUM':
      return 'text-amber-300 border-amber-500/30 bg-amber-950/30'
    case 'HIGH':
      return 'text-orange-300 border-orange-500/30 bg-orange-950/30'
    case 'CRITICAL':
      return 'text-rose-300 border-rose-500/30 bg-rose-950/30'
    default:
      return 'text-slate-300 border-slate-600 bg-slate-900/40'
  }
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

export function Premium3DAnalyzer() {
  const [languageMode, setLanguageMode] = useState<LanguageModeKey>('TECHNICAL')
  const [cardNumber, setCardNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('BRL')
  const [analysis, setAnalysis] = useState<PremiumAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyMessage, setHistoryMessage] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryMessage(null)
    setHistoryError(null)

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
    } catch (err) {
      console.error('[premium-3-0] history fetch failed', err)
      setHistory([])
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setHistoryError(`Falha ao carregar histórico: ${message}`)
      setHistoryMessage('Não foi possível carregar o histórico agora.')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchHistory()
  }, [fetchHistory])

  const handleAnalyze = useCallback(async () => {
    const cleanBin = cardNumber.replace(/\D/g, '').slice(0, 8)

    if (!cleanBin || cleanBin.length < 6) {
      setError('Por favor, insira pelo menos os 6 primeiros dígitos do cartão.')
      return
    }

    const parsedAmount = amount.trim() ? Number(amount.replace(',', '.')) : null
    if (parsedAmount !== null && Number.isNaN(parsedAmount)) {
      setError('Informe um valor numérico válido para a transação.')
      return
    }

    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const response = await fetch('/api/bin-analysis-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bin: cleanBin,
          context: {
            amount: parsedAmount !== null ? Math.round(parsedAmount * 100) : undefined,
            currency,
            mcc: undefined,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
          },
          deviceType: deriveDeviceType(navigator.userAgent),
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null
        throw new Error(extractApiErrorMessage(payload, response.status))
      }

      const payload = (await response.json()) as PremiumAnalysisResponse
      setAnalysis(payload)
      void fetchHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao analisar o cartão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [amount, cardNumber, currency, fetchHistory])

  const riskDimensions = useMemo(() => {
    if (!analysis) return []

    return [
      { key: 'binRisk', label: 'Risco de BIN', icon: Shield, value: analysis.holistic.dimensions.binRisk },
      { key: 'temporalRisk', label: 'Risco Temporal', icon: Clock3, value: analysis.holistic.dimensions.temporalRisk },
      { key: 'behavioralRisk', label: 'Risco Comportamental', icon: Target, value: analysis.holistic.dimensions.behavioralRisk },
      { key: 'geographicRisk', label: 'Risco Geográfico', icon: MapPinned, value: analysis.holistic.dimensions.geographicRisk },
      { key: 'deviceRisk', label: 'Risco de Dispositivo', icon: Cpu, value: analysis.holistic.dimensions.deviceRisk },
      { key: 'gatewayRisk', label: 'Risco de Gateway', icon: Wallet, value: analysis.holistic.dimensions.gatewayRisk },
    ] as const
  }, [analysis])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-blue-500/30 bg-blue-950/40 px-4 py-2 text-sm text-blue-200">
            <Zap className="h-4 w-4" />
            VeriFiBIN Premium 3.0
          </div>
          <h1 className="text-4xl font-bold text-white">Motor holístico multidimensional</h1>
          <p className="mt-3 text-sm text-slate-400">
            Agora com contexto transacional real, 6 dimensões explicáveis, comparação com pares e histórico carregado do endpoint.
          </p>
        </div>

        <Card className="border-slate-700 bg-slate-900/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Globe2 className="h-5 w-5 text-blue-300" />
              Modo de explicação
            </CardTitle>
            <CardDescription className="text-slate-400">{LANGUAGE_MODES[languageMode].description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            {(Object.keys(LANGUAGE_MODES) as LanguageModeKey[]).map((mode) => (
              <Button
                key={mode}
                type="button"
                variant={languageMode === mode ? 'default' : 'outline'}
                onClick={() => setLanguageMode(mode)}
                className={languageMode === mode ? 'bg-blue-600 hover:bg-blue-500' : 'border-slate-600 text-slate-200'}
              >
                {LANGUAGE_MODES[mode].label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/70">
          <CardHeader>
            <CardTitle className="text-white">Analisar BIN com contexto</CardTitle>
            <CardDescription className="text-slate-400">
              Informe o BIN e, se quiser, o valor da transação para enriquecer gateway, 3DS e peer comparison.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_160px_auto]">
            <Input
              type="text"
              placeholder="BIN (6 a 8 dígitos)"
              value={cardNumber}
              onChange={(event) => setCardNumber(event.target.value.replace(/\D/g, '').slice(0, 8))}
              maxLength={8}
              className="bg-slate-950 text-lg font-mono text-white"
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Valor da transação (opcional)"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="bg-slate-950 text-white"
            />
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full bg-slate-950 text-white">
                <SelectValue placeholder="Moeda" />
              </SelectTrigger>
              <SelectContent>
                {['BRL', 'USD', 'EUR', 'GBP', 'CAD', 'MXN'].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAnalyze} disabled={loading} className="bg-blue-600 hover:bg-blue-500">
              {loading ? 'Analisando...' : 'Analisar'}
            </Button>
          </CardContent>
          {error ? (
            <CardContent className="pt-0">
              <div className="flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </CardContent>
          ) : null}
        </Card>

        {analysis ? (
          <>
            <div className="grid gap-4 lg:grid-cols-4">
              <Card className={`border ${getRiskColor(analysis.holistic.level)}`}>
                <CardHeader>
                  <CardDescription className="text-slate-300">Score geral</CardDescription>
                  <CardTitle className="text-4xl text-white">{analysis.holistic.overallScore}/100</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="bg-white/10 text-white">{analysis.holistic.level}</Badge>
                </CardContent>
              </Card>
              <Card className="border-slate-700 bg-slate-900/70">
                <CardHeader>
                  <CardDescription className="text-slate-400">Frictionless</CardDescription>
                  <CardTitle className="text-3xl text-white">{analysis.threeDSAnalysis.frictionlessProbability}%</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={analysis.threeDSAnalysis.frictionlessProbability} className="bg-slate-800" />
                </CardContent>
              </Card>
              <Card className="border-slate-700 bg-slate-900/70">
                <CardHeader>
                  <CardDescription className="text-slate-400">Challenge 3DS</CardDescription>
                  <CardTitle className="text-3xl text-white">{analysis.threeDSAnalysis.challengeProbability}%</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={analysis.threeDSAnalysis.challengeProbability} className="bg-slate-800" />
                </CardContent>
              </Card>
              <Card className="border-slate-700 bg-slate-900/70">
                <CardHeader>
                  <CardDescription className="text-slate-400">Bypass aplicável</CardDescription>
                  <CardTitle className="text-3xl text-white">{analysis.threeDSAnalysis.bypassProbability}%</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {analysis.threeDSAnalysis.applicableBypassMechanisms.length > 0 ? (
                    analysis.threeDSAnalysis.applicableBypassMechanisms.map((mechanism) => (
                      <Badge key={mechanism} variant="outline" className="border-slate-600 text-slate-200">
                        {mechanism}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">Nenhum mecanismo favorável detectado.</span>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <Card className="border-slate-700 bg-slate-900/70">
                <CardHeader>
                  <CardTitle className="text-white">Por dimensão de risco</CardTitle>
                  <CardDescription className="text-slate-400">
                    Cada card abaixo lê diretamente de <code className="text-slate-200">response.holistic</code>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {riskDimensions.map((dimension) => {
                    const Icon = dimension.icon
                    return (
                      <details key={dimension.key} className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-blue-300" />
                            <div>
                              <p className="text-sm font-medium text-white">{dimension.label}</p>
                              <p className="text-xs text-slate-400">{riskSummary(dimension.value.score, languageMode)}</p>
                            </div>
                          </div>
                          <span className="text-lg font-semibold text-white">{dimension.value.score}/100</span>
                        </summary>
                        <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">
                          <Progress value={dimension.value.score} className="bg-slate-800" />
                          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-300">
                            {languageMode === 'TECHNICAL'
                              ? dimension.value.explanation.technical
                              : dimension.value.explanation.popular}
                          </div>
                          {!dimension.value.dataAvailable ? (
                            <p className="text-xs text-amber-300">Dados insuficientes nesta dimensão (baseline neutro).</p>
                          ) : null}
                          <ul className="space-y-2">
                            {dimension.value.factors.map((factor, index) => (
                              <li key={`${dimension.key}-${index}`} className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-white">{factor.label}</p>
                                    <p className="mt-1 text-xs text-slate-400">{formatFactorText(factor, languageMode)}</p>
                                  </div>
                                  <span className={factor.impact > 0 ? 'text-sm font-semibold text-rose-300' : factor.impact < 0 ? 'text-sm font-semibold text-emerald-300' : 'text-sm font-semibold text-slate-400'}>
                                    {formatImpact(factor.impact)}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    )
                  })}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-slate-700 bg-slate-900/70">
                  <CardHeader>
                    <CardTitle className="text-white">Comparação com Pares</CardTitle>
                    <CardDescription className="text-slate-400">Percentil determinístico baseado em BIN + geografia.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Percentil</p>
                        <p className="text-4xl font-bold text-white">{analysis.peerComparison.percentile}</p>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                    </div>
                    <Progress value={analysis.peerComparison.percentile} className="bg-slate-800" />
                    <p className="text-sm text-slate-300">{analysis.peerComparison.description}</p>
                    <p className="text-xs text-slate-500">
                      Cohort {analysis.peerComparison.cohortKey} · {analysis.peerComparison.similarCount} similares
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-700 bg-slate-900/70">
                  <CardHeader>
                    <CardTitle className="text-white">Resumo técnico do BIN</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-300">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                        <p className="text-xs text-slate-500">Emissor</p>
                        <p>{analysis.technicalData.issuer ?? 'Não informado'}</p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                        <p className="text-xs text-slate-500">País</p>
                        <p>{analysis.technicalData.countryName ?? analysis.technicalData.countryCode ?? 'Não informado'}</p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                        <p className="text-xs text-slate-500">Bandeira</p>
                        <p>{analysis.technicalData.brand ?? 'Não informada'}</p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                        <p className="text-xs text-slate-500">Categoria</p>
                        <p>{analysis.technicalData.category ?? 'Não informada'}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-xs text-slate-500">Contexto resolvido</p>
                        <p>
                          {analysis.context.amount ? `${(analysis.context.amount / 100).toFixed(2)} ${analysis.context.currency}` : 'Sem valor informado'} ·{' '}
                          {analysis.context.ipCountryCode ?? 'IP country indisponível'} · UA presente:{' '}
                          {analysis.context.userAgentPresent ? 'sim' : 'não'}
                        </p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-xs text-slate-500">Explicação 3DS</p>
                      <p>{languageMode === 'TECHNICAL' ? analysis.threeDSAnalysis.explanation : 'O motor estimou o caminho 3DS mais provável com base no emissor, no país e no valor da compra.'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : null}

        <Card className="border-slate-700 bg-slate-900/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <History className="h-5 w-5 text-blue-300" />
              ANALYSES HISTORY
            </CardTitle>
            <CardDescription className="text-slate-400">Últimas 10 análises carregadas do endpoint real.</CardDescription>
          </CardHeader>
          <CardContent>
            {historyError ? (
              <div className="mb-3 flex items-start gap-2 rounded-md border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <span>{historyError}</span>
              </div>
            ) : null}
            {historyLoading ? (
              <p className="text-sm text-slate-400">Carregando histórico...</p>
            ) : history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-400">
                {historyMessage ?? 'Nenhum registro disponível no momento.'}
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((entry) => (
                  <div key={entry.id} className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-mono text-sm text-white">{entry.bin}</p>
                      <p className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {entry.brand ? <Badge variant="outline" className="border-slate-600 text-slate-200">{entry.brand}</Badge> : null}
                      <Badge className="bg-white/10 text-white">{entry.risk_level}</Badge>
                      <span className="text-sm text-slate-300">{entry.risk_score}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Premium3DAnalyzer
