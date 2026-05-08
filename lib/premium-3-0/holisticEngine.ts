import { analyzeThreeDS } from "./analyzeThreeDS"
import { calculateRisk } from "./calculateRisk"
import { calculateCardLevelRisk } from "./enrichment/cardLevelRisk"
import { lookupBank } from "./enrichment/bankReputation"
import { enrichGeo, getCountryRiskTier } from "./enrichment/geoEnrichment"
import { enrichTemporal } from "./enrichment/temporalEnrichment"
import type {
  BankReputation,
  BinApiData,
  BinRiskFactor,
  GeoContext,
  HistorySummary,
  RiskContext,
  TemporalContext,
} from "./types"

export interface TransactionContext {
  amount?: number
  currency?: string
  merchantCountry?: string
  merchantCategoryCode?: string
  timestamp: number
  userAgent?: string | null
  ipAddress?: string | null
  ipCountryCode?: string | null
  ipCity?: string | null
  ipLatitude?: string | null
  ipLongitude?: string | null
  isFirstTransaction?: boolean
  history?: HistorySummary[]
  geoContext?: GeoContext
  temporalContext?: TemporalContext
  bankReputation?: BankReputation | null
}

export interface HolisticDimensionScore {
  score: number
  factors: BinRiskFactor[]
}

export interface HolisticScore {
  binRisk: HolisticDimensionScore
  temporalRisk: HolisticDimensionScore
  behavioralRisk: HolisticDimensionScore
  geographicRisk: HolisticDimensionScore
  deviceRisk: HolisticDimensionScore
  gatewayRisk: HolisticDimensionScore
  overallScore: number
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  peerComparison: { percentile: number; description: string }
}

const WEIGHTS = {
  binRisk: 0.3,
  geographicRisk: 0.2,
  behavioralRisk: 0.15,
  temporalRisk: 0.1,
  deviceRisk: 0.15,
  gatewayRisk: 0.1,
} as const

const EUR_EXCHANGE_RATE: Record<string, number> = {
  EUR: 1,
  BRL: 0.18,
  USD: 0.92,
  GBP: 1.16,
  CAD: 0.67,
  AUD: 0.6,
  MXN: 0.05,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function normalizeScore(value: number, min = 0) {
  return clamp(value, min, 100)
}

function toEur(amountInCents?: number, currency?: string) {
  if (typeof amountInCents !== "number") return null
  const rate = EUR_EXCHANGE_RATE[(currency ?? "EUR").toUpperCase()] ?? 1
  return (amountInCents / 100) * rate
}

function buildTemporalRisk(temporal: TemporalContext): HolisticDimensionScore {
  const factors: BinRiskFactor[] = []
  let score = 20

  if (temporal.isNightTime) {
    score += 30
    factors.push({ label: "Horário noturno", impact: 30, reason: "Transações de madrugada/noite têm incidência maior de risco." })
  }

  if (temporal.isWeekend) {
    score += 10
    factors.push({ label: "Final de semana", impact: 10, reason: "Padrões de compra em finais de semana tendem a ser mais voláteis." })
  }

  if (temporal.isBusinessHours) {
    score -= 10
    factors.push({ label: "Horário comercial", impact: -10, reason: "Horário comercial em dia útil reduz risco temporal." })
  }

  if (factors.length === 0) {
    factors.push({ label: "Janela temporal neutra", impact: 0, reason: "Sem sinais temporais adicionais." })
  }

  return { score: normalizeScore(score), factors }
}

function buildBehavioralRisk(history: HistorySummary[] | undefined): HolisticDimensionScore {
  const events = history ?? []
  if (events.length === 0) {
    return {
      score: 30,
      factors: [{ label: "Sem histórico", impact: 30, reason: "Sem histórico recente, risco comportamental fica em patamar neutro." }],
    }
  }

  let score = 20
  const factors: BinRiskFactor[] = []

  const latest = Math.max(...events.map((entry) => entry.timestamp))
  const oneHourWindow = events.filter((entry) => latest - entry.timestamp <= 3_600_000)

  const binCounts = new Map<string, number>()
  for (const entry of oneHourWindow) {
    const key = entry.bin
    binCounts.set(key, (binCounts.get(key) ?? 0) + 1)
  }

  const highVelocity = Array.from(binCounts.values()).some((count) => count > 3)
  if (highVelocity) {
    score += 50
    factors.push({
      label: "Alta velocidade de BIN",
      impact: 50,
      reason: "Mais de 3 análises do mesmo BIN em menos de 1h.",
    })
  }

  const countries = new Set(oneHourWindow.map((entry) => (entry.countryCode ?? "").toUpperCase()).filter(Boolean))
  if (countries.size > 1) {
    score += 40
    factors.push({
      label: "Mudança rápida de país",
      impact: 40,
      reason: "Análises em países diferentes dentro de 1h indicam comportamento anômalo.",
    })
  }

  if (factors.length === 0) {
    factors.push({
      label: "Histórico estável",
      impact: -10,
      reason: "Sem sinais de velocity ou salto geográfico na última hora.",
    })
    score -= 10
  }

  return { score: normalizeScore(score), factors }
}

function buildGeographicRisk(geo: GeoContext, bank: BankReputation | null): HolisticDimensionScore {
  let score = 0
  const factors: BinRiskFactor[] = []

  if (!geo.ipCountryMatch) {
    score += 40
    factors.push({ label: "Divergência BIN vs IP", impact: 40, reason: "País do BIN difere do país identificado no IP." })
  }

  if (geo.ipCountryTier === "critical") {
    score += 50
    factors.push({ label: "País IP crítico", impact: 50, reason: "País do IP em tier crítico." })
  } else if (geo.ipCountryTier === "tier3") {
    score += 25
    factors.push({ label: "País IP tier3", impact: 25, reason: "País do IP em tier3 de risco geográfico." })
  } else if (geo.ipCountryTier === "tier2") {
    score += 10
    factors.push({ label: "País IP tier2", impact: 10, reason: "País do IP em tier2 de risco geográfico." })
  }

  if (bank) {
    if (bank.threeDsMaturity === "LOW") score += 15
    if (bank.threeDsMaturity === "MEDIUM") score += 8
    if (bank.threeDsMaturity === "VERY_HIGH") score -= 8
    factors.push({
      label: "Maturidade 3DS do emissor",
      impact: bank.threeDsMaturity === "LOW" ? 15 : bank.threeDsMaturity === "MEDIUM" ? 8 : bank.threeDsMaturity === "VERY_HIGH" ? -8 : 0,
      reason: `Banco com maturidade ${bank.threeDsMaturity} no benchmark estático.`,
    })
  }

  if (factors.length === 0) {
    factors.push({ label: "Sem sinais geográficos adicionais", impact: 0, reason: "Nenhum fator geográfico de risco extra encontrado." })
  }

  return { score: normalizeScore(score), factors }
}

function buildDeviceRisk(userAgent?: string | null): HolisticDimensionScore {
  const ua = (userAgent ?? "").toLowerCase()

  if (!ua) {
    return {
      score: 30,
      factors: [{ label: "User-Agent ausente", impact: 30, reason: "Sem user-agent, risco de dispositivo vai para base conservadora." }],
    }
  }

  if (/(curl|python|headless|playwright|puppeteer|selenium)/i.test(ua)) {
    return {
      score: 80,
      factors: [{ label: "Automação detectada", impact: 80, reason: "Padrão de bot/headless detectado no user-agent." }],
    }
  }

  if (/(ipad|tablet)/i.test(ua)) {
    return {
      score: 12,
      factors: [{ label: "Tablet", impact: 12, reason: "Perfil tablet detectado." }],
    }
  }

  if (/(iphone|android|mobile)/i.test(ua)) {
    return {
      score: 10,
      factors: [{ label: "Mobile", impact: 10, reason: "Perfil mobile detectado." }],
    }
  }

  return {
    score: 15,
    factors: [{ label: "Desktop", impact: 15, reason: "Perfil desktop tradicional detectado." }],
  }
}

function buildGatewayRisk(amount?: number, currency?: string): HolisticDimensionScore {
  if (typeof amount !== "number") {
    return {
      score: 25,
      factors: [{ label: "Sem valor de transação", impact: 25, reason: "Sem amount, o risco de gateway usa base conservadora." }],
    }
  }

  const amountEur = toEur(amount, currency)
  let score = 0
  const factors: BinRiskFactor[] = [{ label: "Valor informado", impact: 0, reason: "Valor da transação recebido pelo motor de gateway." }]

  if (amountEur !== null && amountEur > 1000) {
    score += 30
    factors.push({ label: "Valor alto", impact: 30, reason: "Valor acima de 1000 EUR equivalente aumenta risco de gateway." })
  } else if (amountEur !== null && amountEur < 5) {
    score += 15
    factors.push({ label: "Microtransação", impact: 15, reason: "Microtransações podem indicar testes de cartão." })
  }

  return { score: normalizeScore(score), factors }
}

function buildPeerComparison(binData: BinApiData, overallScore: number) {
  const tier = getCountryRiskTier(binData.countryCode)
  const base = 100 - overallScore
  const tierAdjustment = tier === "tier1" ? 10 : tier === "critical" ? -15 : 0
  const percentile = clamp(base + tierAdjustment, 1, 99)

  return {
    percentile,
    description: `Melhor que ${percentile}% dos pares no grupo ${(binData.brand ?? "UNKNOWN").toUpperCase()}-${(binData.countryCode ?? "XX").toUpperCase()}-${(binData.type ?? "UNKNOWN").toUpperCase()}.`,
  }
}

function getOverallRiskLevel(score: number): HolisticScore["riskLevel"] {
  if (score >= 85) return "CRITICAL"
  if (score >= 60) return "HIGH"
  if (score >= 35) return "MEDIUM"
  return "LOW"
}

function buildBinRisk(binData: BinApiData, context: Partial<TransactionContext>): HolisticDimensionScore {
  const threeDSAnalysis = analyzeThreeDS(binData, context)
  const baseRisk = calculateRisk(binData, threeDSAnalysis)
  const cardLevelRisk = calculateCardLevelRisk(binData)
  const score = normalizeScore(baseRisk.score + cardLevelRisk.score, 5)

  return { score, factors: [...baseRisk.factors, ...cardLevelRisk.factors] }
}

export function calculateHolisticRisk(ctx: RiskContext) {
  return {
    binRisk: buildBinRisk(ctx.binData, { amount: ctx.amount, currency: ctx.currency, timestamp: 0 }).score,
    temporalRisk: buildTemporalRisk(ctx.temporal).score,
    behavioralRisk: buildBehavioralRisk(ctx.history).score,
    geographicRisk: buildGeographicRisk(ctx.geo, ctx.bank).score,
    deviceRisk: buildDeviceRisk(ctx.userAgent).score,
    gatewayRisk: buildGatewayRisk(ctx.amount, ctx.currency).score,
  }
}

export function runHolisticAnalysis(binData: BinApiData, context: Partial<TransactionContext>): HolisticScore {
  const geo =
    context.geoContext ??
    enrichGeo(binData.countryCode ?? "", {
      ipCountry: context.ipCountryCode,
      ipCity: context.ipCity,
      ipLatitude: context.ipLatitude,
      ipLongitude: context.ipLongitude,
      realIp: context.ipAddress,
    })

  const temporal = context.temporalContext ?? enrichTemporal(typeof context.timestamp === "number" ? context.timestamp : 0)
  const bank = context.bankReputation ?? lookupBank(binData.issuer ?? "")

  const binRisk = buildBinRisk(binData, context)
  const temporalRisk = buildTemporalRisk(temporal)
  const behavioralRisk = buildBehavioralRisk(context.history)
  const geographicRisk = buildGeographicRisk(geo, bank)
  const deviceRisk = buildDeviceRisk(context.userAgent)
  const gatewayRisk = buildGatewayRisk(context.amount, context.currency)

  const overallScore = normalizeScore(
    binRisk.score * WEIGHTS.binRisk +
      geographicRisk.score * WEIGHTS.geographicRisk +
      behavioralRisk.score * WEIGHTS.behavioralRisk +
      temporalRisk.score * WEIGHTS.temporalRisk +
      deviceRisk.score * WEIGHTS.deviceRisk +
      gatewayRisk.score * WEIGHTS.gatewayRisk,
  )

  return {
    binRisk,
    temporalRisk,
    behavioralRisk,
    geographicRisk,
    deviceRisk,
    gatewayRisk,
    overallScore,
    riskLevel: getOverallRiskLevel(overallScore),
    peerComparison: buildPeerComparison(binData, overallScore),
  }
}
