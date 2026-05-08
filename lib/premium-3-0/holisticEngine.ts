import { analyzeThreeDS } from "./analyzeThreeDS"
import { calculateRisk } from "./calculateRisk"
import { calculateBankRisk } from "./enrichment/bankReputation"
import { calculateCardLevelRisk } from "./enrichment/cardLevelRisk"
import { enrichGeo, getCountryRiskTier } from "./enrichment/geoEnrichment"
import { enrichTemporal } from "./enrichment/temporalEnrichment"
import type { BinApiData, BinRiskFactor } from "./types"

export interface TransactionContext {
  amount?: number
  currency?: string
  merchantCountry?: string
  merchantCategoryCode?: string
  timestamp: number
  userAgent?: string | null
  ipAddress?: string | null
  ipCountryCode?: string | null
  isFirstTransaction?: boolean
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

const BRL_EXCHANGE_RATE: Record<string, number> = {
  BRL: 1,
  EUR: 6,
  USD: 5.45,
  GBP: 6.9,
  CAD: 4.0,
  AUD: 3.6,
  MXN: 0.29,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function normalizeScore(value: number, min = 0) {
  return clamp(value, min, 100)
}

function convertAmountToEur(amountInCents?: number, currency?: string) {
  if (typeof amountInCents !== "number") return null
  const rate = EUR_EXCHANGE_RATE[(currency ?? "EUR").toUpperCase()] ?? 1
  return (amountInCents / 100) * rate
}

function convertAmountToBrl(amountInCents?: number, currency?: string) {
  if (typeof amountInCents !== "number") return null
  const rate = BRL_EXCHANGE_RATE[(currency ?? "BRL").toUpperCase()] ?? 1
  return (amountInCents / 100) * rate
}

function buildBehavioralRisk(context: Partial<TransactionContext>): HolisticDimensionScore {
  if (context.isFirstTransaction !== false) {
    return {
      score: 40,
      factors: [
        {
          label: "Sem histórico transacional para este cartão",
          impact: 20,
          reason: "Na ausência de histórico ou em primeira transação, o motor usa score comportamental conservador.",
        },
      ],
    }
  }

  return {
    score: 20,
    factors: [
      {
        label: "Há indicação de histórico prévio",
        impact: -10,
        reason: "Quando a transação não é a primeira, o risco comportamental base cai para patamar moderado.",
      },
    ],
  }
}

function buildDeviceRisk(userAgent?: string | null): HolisticDimensionScore {
  const factors: BinRiskFactor[] = []
  let score = 15
  const normalizedUserAgent = (userAgent ?? "").toLowerCase()

  if (!normalizedUserAgent) {
    score += 20
    factors.push({
      label: "User-Agent ausente",
      impact: 20,
      reason: "Sem identificação de dispositivo, o motor assume maior incerteza operacional.",
    })
  } else if (/(curl|python|axios|headless|phantom|playwright|puppeteer|selenium)/i.test(normalizedUserAgent)) {
    score += 50
    factors.push({
      label: "Padrão de bot/headless detectado",
      impact: 50,
      reason: "O user-agent indica automação ou browser headless, elevando o risco de dispositivo.",
    })
  } else if (/(iphone|android|mobile|ipad)/i.test(normalizedUserAgent)) {
    score -= 5
    factors.push({
      label: "Dispositivo móvel comum",
      impact: -5,
      reason: "Fluxos mobile modernos tendem a ter telemetria e biometria mais consistentes.",
    })
  } else {
    factors.push({
      label: "Desktop/browser tradicional",
      impact: 0,
      reason: "User-agent de desktop identificado sem sinais claros de automação.",
    })
  }

  return { score: normalizeScore(score), factors }
}

function buildGatewayRisk(context: Partial<TransactionContext>): HolisticDimensionScore {
  const factors: BinRiskFactor[] = []

  if (typeof context.amount !== "number") {
    factors.push({
      label: "Valor da transação ausente",
      impact: 20,
      reason: "Sem valor da compra, o motor usa score 20 por falta de contexto do gateway.",
    })

    return { score: 20, factors }
  }

  let score = 30
  const amountInBrl = convertAmountToBrl(context.amount, context.currency)
  const amountInEur = convertAmountToEur(context.amount, context.currency)

  factors.push({
    label: "Valor da transação informado",
    impact: 10,
    reason: "Com valor disponível, o motor consegue estimar pressão de risco do gateway e de possíveis isenções.",
  })

  if (amountInBrl !== null && amountInBrl > 5000) {
    score += 20
    factors.push({
      label: "Valor alto para o gateway",
      impact: 20,
      reason: `O valor equivalente em BRL é ${amountInBrl.toFixed(2)}, acima da faixa de R$ 5.000.`,
    })
  }

  if (amountInEur !== null && amountInEur < 30) {
    score -= 5
    factors.push({
      label: "Faixa elegível para isenção de baixo valor",
      impact: -5,
      reason: `O valor equivalente em EUR é ${amountInEur.toFixed(2)}, permitindo leitura de low-value exemption/SCA.`,
    })
  }

  return { score: normalizeScore(score), factors }
}

function buildPeerComparison(
  binData: BinApiData,
  binRiskScore: number,
  geographicRiskScore: number,
  countryRiskTier: ReturnType<typeof getCountryRiskTier>,
) {
  const category = (binData.category ?? "").toUpperCase()
  const brand = (binData.brand ?? "").toUpperCase()

  let percentile = 100 - Math.round(binRiskScore * 0.6 + geographicRiskScore * 0.4)

  if (countryRiskTier === "TIER1") percentile += 10
  if (countryRiskTier === "CRITICAL") percentile -= 20
  if (["VISA", "MASTERCARD", "AMEX", "AMERICAN EXPRESS"].includes(brand)) percentile += 5
  if (["BLACK", "PLATINUM", "SIGNATURE", "INFINITE", "WORLD ELITE"].some((entry) => category.includes(entry))) percentile += 10
  if (binData.isPrepaid) percentile -= 25

  percentile = clamp(percentile, 1, 99)

  const description =
    percentile >= 75
      ? `Melhor que ${percentile}% dos cartões comparáveis em BIN + geografia.`
      : percentile >= 40
        ? `Na média do mercado: melhor que ${percentile}% dos cartões comparáveis.`
        : `Abaixo da média: melhor que apenas ${percentile}% dos cartões comparáveis.`

  return { percentile, description }
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
  const bankRisk = calculateBankRisk(binData.issuer ?? null)
  const cardLevelRisk = calculateCardLevelRisk(binData)

  let score = baseRisk.score + Math.round((bankRisk.score - 30) * 0.5) + cardLevelRisk.score
  const factors = [...baseRisk.factors, ...bankRisk.factors, ...cardLevelRisk.factors]

  if (binData.source === "UNKNOWN" && !binData.brand && !binData.countryCode && !binData.issuer) {
    score = Math.min(score, 55)
    factors.push({
      label: "Dados do BIN insuficientes para certeza alta",
      impact: -10,
      reason: "Quando a origem é UNKNOWN e faltam campos centrais, o motor evita classificar o BIN como crítico só pela ausência de dados.",
    })
  }

  return { score: normalizeScore(score, 5), factors }
}

export function runHolisticAnalysis(binData: BinApiData, context: Partial<TransactionContext>): HolisticScore {
  const normalizedContext: Partial<TransactionContext> = {
    ...context,
    timestamp: typeof context?.timestamp === "number" ? context.timestamp : 0,
  }

  const binRisk = buildBinRisk(binData, normalizedContext)
  const temporalRisk = enrichTemporal(normalizedContext.timestamp ?? 0)
  const behavioralRisk = buildBehavioralRisk(normalizedContext)
  const geographicRisk = enrichGeo(
    binData.countryCode ?? "",
    normalizedContext.ipAddress ?? null,
    normalizedContext.ipCountryCode ?? null,
  )
  const deviceRisk = buildDeviceRisk(normalizedContext.userAgent)
  const gatewayRisk = buildGatewayRisk(normalizedContext)

  const overallScore = normalizeScore(
    binRisk.score * WEIGHTS.binRisk +
      geographicRisk.score * WEIGHTS.geographicRisk +
      behavioralRisk.score * WEIGHTS.behavioralRisk +
      temporalRisk.score * WEIGHTS.temporalRisk +
      deviceRisk.score * WEIGHTS.deviceRisk +
      gatewayRisk.score * WEIGHTS.gatewayRisk,
  )

  return {
    binRisk: { score: binRisk.score, factors: binRisk.factors },
    temporalRisk: { score: temporalRisk.score, factors: temporalRisk.factors },
    behavioralRisk: { score: behavioralRisk.score, factors: behavioralRisk.factors },
    geographicRisk: { score: geographicRisk.score, factors: geographicRisk.factors },
    deviceRisk,
    gatewayRisk,
    overallScore,
    riskLevel: getOverallRiskLevel(overallScore),
    peerComparison: buildPeerComparison(binData, binRisk.score, geographicRisk.score, geographicRisk.countryRiskTier),
  }
}
