'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  ExternalLink,
  Globe2,
  Laptop,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Smartphone,
} from 'lucide-react'
import Link from 'next/link'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import type { SessionRiskResponse } from '@/lib/premium-3-0/holisticTypes'

// ============================================================================
// i18n (PT-BR default, EN toggle)
// ============================================================================

const TRANSLATIONS = {
  'pt-BR': {
    title: 'Análise Antifraude da Sessão',
    subtitle: 'Análise automática de risco do visitante em tempo real',
    analyzing: 'Analisando sessão…',
    retry: 'Tentar novamente',
    errorTitle: 'Erro na análise',
    errorGeneric: 'Não foi possível analisar a sessão. Tente novamente.',
    geo: 'Geolocalização',
    network: 'Reputação de Rede',
    device: 'Dispositivo',
    hostRep: 'Host Reputation',
    fingerprint: 'Fingerprint da Sessão',
    riskScore: 'Score de Risco',
    recommendation: 'Recomendação',
    whyScore: 'Por que esse score?',
    sourcesUsed: 'Fontes consultadas',
    verifyBin: 'Verificar BIN',
    notAvailable: 'Indisponível',
    tor: 'TOR',
    proxy: 'Proxy',
    vpn: 'VPN',
    hijacked: 'Sequestrado',
    malware: 'Malware',
    bot: 'Bot',
    spider: 'Spider',
    listed: 'Listado',
    country: 'País',
    city: 'Cidade',
    isp: 'ISP',
    asn: 'ASN',
    hostname: 'Hostname',
    browser: 'Browser',
    os: 'Sistema Operacional',
    type: 'Tipo',
    mobile: 'Mobile',
    ipMasked: 'IP (mascarado)',
    timezone: 'Fuso horário',
    languages: 'Idiomas',
    screen: 'Tela',
    impact: 'Impacto',
    reason: 'Motivo',
    reputationScore: 'Score de reputação',
    categories: 'Categorias',
    generatedAt: 'Gerado em',
    toggleLanguage: 'Switch to English',
    riskLevel: {
      LOW: 'Baixo',
      MEDIUM: 'Médio',
      HIGH: 'Alto',
      CRITICAL: 'Crítico',
    },
    recommendation_map: {
      ALLOW: '✅ Permitir',
      REVIEW: '🔍 Revisar',
      CHALLENGE: '⚠️ Desafiar',
      BLOCK: '🚫 Bloquear',
    },
  },
  'en': {
    title: 'Session Anti-Fraud Analysis',
    subtitle: 'Automatic real-time visitor risk analysis',
    analyzing: 'Analyzing session…',
    retry: 'Retry',
    errorTitle: 'Analysis error',
    errorGeneric: 'Could not analyze the session. Please try again.',
    geo: 'Geolocation',
    network: 'Network Reputation',
    device: 'Device',
    hostRep: 'Host Reputation',
    fingerprint: 'Session Fingerprint',
    riskScore: 'Risk Score',
    recommendation: 'Recommendation',
    whyScore: 'Why this score?',
    sourcesUsed: 'Sources used',
    verifyBin: 'Verify BIN',
    notAvailable: 'Unavailable',
    tor: 'TOR',
    proxy: 'Proxy',
    vpn: 'VPN',
    hijacked: 'Hijacked',
    malware: 'Malware',
    bot: 'Bot',
    spider: 'Spider',
    listed: 'Listed',
    country: 'Country',
    city: 'City',
    isp: 'ISP',
    asn: 'ASN',
    hostname: 'Hostname',
    browser: 'Browser',
    os: 'Operating System',
    type: 'Type',
    mobile: 'Mobile',
    ipMasked: 'IP (masked)',
    timezone: 'Timezone',
    languages: 'Languages',
    screen: 'Screen',
    impact: 'Impact',
    reason: 'Reason',
    reputationScore: 'Reputation score',
    categories: 'Categories',
    generatedAt: 'Generated at',
    toggleLanguage: 'Mudar para PT-BR',
    riskLevel: {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      CRITICAL: 'Critical',
    },
    recommendation_map: {
      ALLOW: '✅ Allow',
      REVIEW: '🔍 Review',
      CHALLENGE: '⚠️ Challenge',
      BLOCK: '🚫 Block',
    },
  },
} as const

type Lang = keyof typeof TRANSLATIONS
type Translations = (typeof TRANSLATIONS)[Lang]

// ============================================================================
// Risk colors
// ============================================================================

function riskColor(level: string) {
  switch (level) {
    case 'LOW':
      return 'text-green-400 border-green-500/50 bg-green-500/10'
    case 'MEDIUM':
      return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10'
    case 'HIGH':
      return 'text-orange-400 border-orange-500/50 bg-orange-500/10'
    case 'CRITICAL':
      return 'text-red-400 border-red-500/50 bg-red-500/10'
    default:
      return 'text-gray-400 border-gray-500/50 bg-gray-500/10'
  }
}

function scoreBarColor(score: number) {
  if (score <= 25) return 'bg-green-500'
  if (score <= 50) return 'bg-yellow-500'
  if (score <= 75) return 'bg-orange-500'
  return 'bg-red-500'
}

// ============================================================================
// Browser signal collection (no external libs — crypto.subtle only)
// ============================================================================

async function computeFingerprint(): Promise<string> {
  try {
    const ua = navigator.userAgent
    const langs = navigator.languages?.join(',') ?? navigator.language
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const sw = screen.width
    const sh = screen.height
    const cd = screen.colorDepth
    const pluginCount = navigator.plugins?.length ?? 0

    // Small canvas fingerprint (100x40)
    let canvasData = ''
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 40
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, 100, 40)
        ctx.fillStyle = '#00ffff'
        ctx.font = '14px monospace'
        ctx.fillText('VFB3.0', 10, 25)
        canvasData = canvas.toDataURL().slice(0, 128)
      }
    } catch {
      // canvas blocked — continue without it
    }

    // WebGL renderer
    let webglRenderer = ''
    try {
      const gl = document.createElement('canvas').getContext('webgl') as WebGLRenderingContext | null
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info')
        if (ext) {
          webglRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string
        }
      }
    } catch {
      // WebGL unavailable — continue
    }

    const raw = [ua, langs, tz, sw, sh, cd, pluginCount, canvasData, webglRenderer].join('|')
    const encoded = new TextEncoder().encode(raw)
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return ''
  }
}

async function collectBrowserSignals() {
  const fingerprint = await computeFingerprint()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const languages = Array.from(navigator.languages ?? [navigator.language])
  const screen_data =
    typeof screen !== 'undefined'
      ? { w: screen.width, h: screen.height, colorDepth: screen.colorDepth }
      : null

  return { fingerprint: fingerprint || null, timezone, languages, screen: screen_data }
}

// ============================================================================
// API response type
// ============================================================================

type AntifraudApiResponse = {
  ok: boolean
  data?: Omit<SessionRiskResponse, 'ip'>
  error?: { code: string; message: string }
}

// ============================================================================
// UI sub-components
// ============================================================================

function InfoRow({ label, value, t }: { label: string; value: string | null | undefined; t: Translations }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1 border-b border-cyan-900/30 last:border-0">
      <span className="text-xs text-cyan-600 whitespace-nowrap">{label}</span>
      <span className="text-xs text-gray-300 text-right break-all">
        {value || <span className="text-gray-600 italic">{t.notAvailable}</span>}
      </span>
    </div>
  )
}

function NetworkFlagChip({
  active,
  label,
}: {
  active: boolean
  label: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-semibold border ${
        active
          ? 'bg-red-500/20 border-red-500/50 text-red-400'
          : 'bg-green-500/10 border-green-800/40 text-green-600 opacity-50'
      }`}
    >
      {active ? '⚠' : '✓'} {label}
    </span>
  )
}

// ============================================================================
// Loading skeleton
// ============================================================================

function SessionLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    </div>
  )
}

// ============================================================================
// Main component
// ============================================================================

export default function AntifraudSession() {
  const [lang, setLang] = useState<Lang>('pt-BR')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Omit<SessionRiskResponse, 'ip'> | null>(null)

  const t = TRANSLATIONS[lang]

  const runAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const signals = await collectBrowserSignals()

      const response = await fetch('/api/antifraud-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signals),
      })

      const json = (await response.json()) as AntifraudApiResponse

      if (!json.ok || !json.data) {
        const errMsg =
          typeof json.error === 'object' && json.error?.message
            ? json.error.message
            : t.errorGeneric
        setError(errMsg)
        return
      }

      setData(json.data)
    } catch {
      setError(t.errorGeneric)
    } finally {
      setLoading(false)
    }
  }, [t.errorGeneric])

  useEffect(() => {
    runAnalysis()
  }, [runAnalysis])

  const riskBadgeClass = data ? riskColor(data.riskLevel) : ''
  const DeviceIcon =
    data?.device.deviceType === 'MOBILE' || data?.device.deviceType === 'TABLET'
      ? Smartphone
      : Laptop

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-gray-100 font-mono">
      {/* ── Header ── */}
      <div className="border-b border-cyan-900/50 bg-[#0d0d2b]/80 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-cyan-400" />
            <div>
              <h1 className="text-base font-bold text-cyan-300 tracking-wide">{t.title}</h1>
              <p className="text-xs text-cyan-700">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <Badge className={`border text-xs ${riskBadgeClass}`} variant="outline">
                {t.riskLevel[data.riskLevel]}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-cyan-600 hover:text-cyan-400 text-xs"
              onClick={() => setLang((l) => (l === 'pt-BR' ? 'en' : 'pt-BR'))}
            >
              {t.toggleLanguage}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Loading */}
        {loading && (
          <Card className="bg-[#0d0d2b] border-cyan-900/40">
            <CardContent className="p-5">
              <p className="text-xs text-cyan-500 mb-4">{t.analyzing}</p>
              <SessionLoadingSkeleton />
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {!loading && error && (
          <Card className="bg-[#0d0d2b] border-red-900/50">
            <CardContent className="p-5 flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <div>
                <p className="font-semibold text-red-300">{t.errorTitle}</p>
                <p className="text-sm text-gray-400 mt-1">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-700 text-red-300 hover:bg-red-900/30 gap-2"
                onClick={runAnalysis}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t.retry}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {!loading && data && (
          <>
            {/* ── Score panel ── */}
            <Card className="bg-[#0d0d2b] border-cyan-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-cyan-400 flex items-center gap-2">
                  {data.riskLevel === 'LOW' || data.riskLevel === 'MEDIUM' ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : data.riskLevel === 'HIGH' ? (
                    <ShieldAlert className="h-4 w-4" />
                  ) : (
                    <ShieldX className="h-4 w-4" />
                  )}
                  {t.riskScore}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end gap-3">
                  <span className={`text-5xl font-bold ${riskBadgeClass.split(' ')[0]}`}>
                    {data.riskScore}
                  </span>
                  <span className="text-sm text-gray-500 mb-1">/100</span>
                  <Badge className={`ml-auto border ${riskBadgeClass}`} variant="outline">
                    {t.riskLevel[data.riskLevel]}
                  </Badge>
                </div>
                <Progress
                  value={data.riskScore}
                  className="h-2 bg-gray-800"
                  style={{ '--progress-color': undefined } as React.CSSProperties}
                />
                <div className={`h-1.5 rounded-full ${scoreBarColor(data.riskScore)} w-[${data.riskScore}%]`} />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t.recommendation}</span>
                  <span className="text-sm font-semibold">
                    {t.recommendation_map[data.recommendation]}
                  </span>
                </div>

                {/* Factors accordion */}
                {data.factors.length > 0 && (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="factors" className="border-cyan-900/40">
                      <AccordionTrigger className="text-xs text-cyan-600 hover:text-cyan-400 py-2">
                        {t.whyScore} ({data.factors.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-1">
                          {data.factors.map((f, i) => (
                            <div
                              key={i}
                              className="rounded-md bg-gray-900/50 px-3 py-2 border border-gray-800/60"
                            >
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="text-xs font-semibold text-gray-200">{f.label}</span>
                                <span
                                  className={`text-xs font-mono ${f.impact > 0 ? 'text-red-400' : f.impact < 0 ? 'text-green-400' : 'text-gray-500'}`}
                                >
                                  {f.impact > 0 ? `+${f.impact}` : f.impact}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">{f.reason}</p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </CardContent>
            </Card>

            {/* ── Grid cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Geolocation */}
              <Card className="bg-[#0d0d2b] border-cyan-900/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-cyan-400 flex items-center gap-2">
                    <Globe2 className="h-4 w-4" />
                    🌍 {t.geo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5">
                  <InfoRow label={t.ipMasked} value={data.ipMasked} t={t} />
                  <InfoRow label={t.country} value={data.geo.country} t={t} />
                  <InfoRow label={t.city} value={data.geo.city} t={t} />
                  <InfoRow label={t.isp} value={data.geo.isp} t={t} />
                  <InfoRow label={t.asn} value={data.geo.asn} t={t} />
                  <InfoRow label={t.hostname} value={data.geo.hostname} t={t} />
                </CardContent>
              </Card>

              {/* Network Reputation */}
              <Card className="bg-[#0d0d2b] border-cyan-900/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-cyan-400 flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    🛡️ {t.network}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    <NetworkFlagChip active={data.network.isTor} label={t.tor} />
                    <NetworkFlagChip active={data.network.isVpn} label={t.vpn} />
                    <NetworkFlagChip active={data.network.isProxy} label={t.proxy} />
                    <NetworkFlagChip active={data.network.isHijacked} label={t.hijacked} />
                    <NetworkFlagChip active={data.network.isMalware} label={t.malware} />
                    <NetworkFlagChip active={data.network.isBot} label={t.bot} />
                    <NetworkFlagChip active={data.network.isSpider} label={t.spider} />
                    <NetworkFlagChip active={data.network.isListed} label={t.listed} />
                  </div>
                  {data.network.blocklistCount > 0 && (
                    <p className="text-xs text-red-400 mt-2">
                      ⚠️ {data.network.blocklistCount} blocklist(s)
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Device */}
              <Card className="bg-[#0d0d2b] border-cyan-900/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-cyan-400 flex items-center gap-2">
                    <DeviceIcon className="h-4 w-4" />
                    💻 {t.device}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5">
                  <InfoRow label={t.browser} value={data.device.browser} t={t} />
                  <InfoRow label="" value={data.device.browserVersion} t={t} />
                  <InfoRow label={t.os} value={data.device.os} t={t} />
                  <InfoRow label="" value={data.device.osVersion} t={t} />
                  <InfoRow label={t.type} value={data.device.deviceType} t={t} />
                  <div className="flex gap-2 pt-1">
                    {data.device.isMobile && (
                      <Badge variant="outline" className="text-xs border-cyan-800 text-cyan-500">
                        {t.mobile}
                      </Badge>
                    )}
                    {data.device.isBot && (
                      <Badge variant="outline" className="text-xs border-red-800 text-red-400">
                        BOT
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Host Reputation */}
              <Card className="bg-[#0d0d2b] border-cyan-900/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-cyan-400 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    🔍 {t.hostRep}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.hostReputation ? (
                    <div className="space-y-0.5">
                      <InfoRow
                        label={t.reputationScore}
                        value={
                          data.hostReputation.score !== null
                            ? String(data.hostReputation.score)
                            : null
                        }
                        t={t}
                      />
                      <InfoRow
                        label="Listed"
                        value={data.hostReputation.listed ? '⚠️ Sim' : '✓ Não'}
                        t={t}
                      />
                      {data.hostReputation.categories.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-1">
                          {data.hostReputation.categories.map((c) => (
                            <Badge
                              key={c}
                              variant="outline"
                              className="text-xs border-yellow-800 text-yellow-500"
                            >
                              {c}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 italic">{t.notAvailable}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Fingerprint ── */}
            <Card className="bg-[#0d0d2b] border-cyan-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-cyan-400">🆔 {t.fingerprint}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {data.client.fingerprint ? (
                  <code className="text-xs font-mono text-cyan-300 break-all bg-gray-900/50 px-2 py-1 rounded">
                    {data.client.fingerprint.slice(0, 16)}…
                  </code>
                ) : (
                  <span className="text-xs text-gray-600 italic">{t.notAvailable}</span>
                )}
                <InfoRow label={t.timezone} value={data.client.timezone} t={t} />
                <InfoRow
                  label={t.languages}
                  value={data.client.languages.join(', ') || null}
                  t={t}
                />
                {data.client.screen && (
                  <InfoRow
                    label={t.screen}
                    value={`${data.client.screen.w}×${data.client.screen.h} @${data.client.screen.colorDepth}bit`}
                    t={t}
                  />
                )}
              </CardContent>
            </Card>

            {/* ── Footer ── */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-gray-600">{t.sourcesUsed}:</span>
              {data.sourcesUsed.length > 0 ? (
                data.sourcesUsed.map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="text-xs border-cyan-900 text-cyan-700 font-mono"
                  >
                    {s}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-gray-600 italic">heurística local</span>
              )}
              <span className="ml-auto text-xs text-gray-600">
                {new Date(data.generatedAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-cyan-700 hover:text-cyan-400 text-xs gap-1"
                onClick={runAnalysis}
              >
                <RefreshCw className="h-3 w-3" />
                {t.retry}
              </Button>
              <Link
                href="/"
                className="text-xs text-cyan-700 hover:text-cyan-400 flex items-center gap-1"
              >
                {t.verifyBin} <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
