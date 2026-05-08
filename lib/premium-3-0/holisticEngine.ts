import { analyzeThreeDS } from "./analyzeThreeDS"
import { calculateRisk } from "./calculateRisk"
import { calculateBankRisk } from "./enrichment/bankReputation"
import { calculateCardLevelRisk } from "./enrichment/cardLevelRisk"
import { enrichGeo, getCountryRiskTier } from "./enrichment/geoEnrichment"
import { enrichTemporal } from "./enrichment/temporalEnrichment"
import { enrichDevice } from "./enrichment/deviceEnrichment"
import { enrichGateway } from "./enrichment/gatewayRisk"
import type { BinApiData, BinRiskFactor, RiskContext } from "./types"

export interface TransactionContext {
  amount?: number
  currency?: string
  merchantCountry?: string
  merchantCategoryCode?: string
  mcc?: string
  timestamp: number
  userAgent?: string | null
  ipAddress?: string | null
  ipCountryCode?: string | null
  isFirstTransaction?: boolean
  history?: Array<{ bin: string; timestamp: number; countryCode?: string | null }>
}

export interface HolisticDimensionScore {
  score: number
  weight: number
  factors: BinRiskFactor[]
  explanation: { technical: string; popular: string }
  dataAvailable: boolean
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
  recommendation: "APPROVE" | "REVIEW" | "REQUIRE_3DS" | "BLOCK_PREVENTIVELY" | "INSUFFICIENT_DATA"
  ensembleConfidence: number
  sourcesUsed: string[]
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function normalizeScore(value: number, min = 0) {
  return clamp(value, min, 100)
}

function buildBehavioralRisk(context: Partial<TransactionContext>): Omit<HolisticDimensionScore, "weight" | "explanation" | "dataAvailable"> {
  const recentHistory = (context.history ?? []).filter((entry) => {
    const referenceTimestamp = typeof context.timestamp === "number" ? context.timestamp : Date.now()
    return Math.abs(referenceTimestamp - entry.timestamp) <= 60 * 60 * 1000
  })
  const hasGeoDivergence = recentHistory.some(
    (entry) => entry.countryCode && context.ipCountryCode && entry.countryCode !== context.ipCountryCode,
  )

  if (recentHistory.length >= 4) {
    return {
      score: hasGeoDivergence ? 80 : 70,
      factors: [
        {
          label: "Alta velocidade transacional recente",
          impact: 35,
          reason: "Quatro ou mais eventos recentes no histórico elevam o risco comportamental.",
        },
        ...(hasGeoDivergence
          ? [
              {
                label: "Mudança geográfica recente no histórico",
                impact: 10,
                reason: "O histórico recente mostra países divergentes em intervalo curto.",
              },
            ]
          : []),
      ],
    }
  }

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

function getRecommendation(
  level: HolisticScore["riskLevel"],
  ensembleConfidence: number,
): HolisticScore["recommendation"] {
  if (ensembleConfidence < 34) return "INSUFFICIENT_DATA"
  switch (level) {
    case "LOW":
      return "APPROVE"
    case "MEDIUM":
      return "REVIEW"
    case "HIGH":
      return "REQUIRE_3DS"
    case "CRITICAL":
      return "BLOCK_PREVENTIVELY"
  }
}

function buildBinRisk(binData: BinApiData, context: Partial<TransactionContext>): Omit<HolisticDimensionScore, "weight" | "explanation" | "dataAvailable"> {
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

export function calculateHolisticRisk(context: RiskContext) {
  const behavioralRisk = buildBehavioralRisk({
    timestamp: context.history?.[0]?.timestamp ?? Date.now(),
    history: context.history,
    ipCountryCode: context.geo.ipCountryCode,
    isFirstTransaction: context.history && context.history.length > 0 ? false : true,
  })
  const deviceRisk = enrichDevice(context.userAgent)
  const gatewayRisk = enrichGateway({
    amount: context.amount,
    currency: context.currency,
  })
  const binRisk = buildBinRisk(context.binData, {
    amount: context.amount,
    currency: context.currency,
  })

  return {
    binRisk: binRisk.score,
    temporalRisk: context.temporal.score,
    behavioralRisk: behavioralRisk.score,
    geographicRisk: context.geo.score,
    deviceRisk: deviceRisk.score,
    gatewayRisk: gatewayRisk.score,
  }
}

export function runHolisticAnalysis(binData: BinApiData, context: Partial<TransactionContext>): HolisticScore {
  const normalizedContext: Partial<TransactionContext> = {
    ...context,
    timestamp: typeof context?.timestamp === "number" ? context.timestamp : 0,
  }

  const binRisk = buildBinRisk(binData, normalizedContext)
  const temporalRiskRaw = enrichTemporal(normalizedContext.timestamp ?? 0)
  const behavioralRisk = buildBehavioralRisk(normalizedContext)
  const geographicRisk = enrichGeo(
    binData.countryCode ?? "",
    normalizedContext.ipAddress ?? null,
    normalizedContext.ipCountryCode ?? null,
  )
  const deviceRiskRaw = enrichDevice(normalizedContext.userAgent)
  const gatewayRiskRaw = enrichGateway({
    amount: normalizedContext.amount,
    currency: normalizedContext.currency,
    mcc: normalizedContext.mcc ?? normalizedContext.merchantCategoryCode,
  })

  const binDataAvailable = Boolean(binData.brand || binData.countryCode || binData.issuer)
  const temporalDataAvailable = (normalizedContext.timestamp ?? 0) > 0
  const behavioralDataAvailable = typeof normalizedContext.isFirstTransaction === "boolean"
  const geoDataAvailable = Boolean(binData.countryCode || normalizedContext.ipCountryCode)
  const deviceDataAvailable = Boolean(normalizedContext.userAgent)
  const gatewayDataAvailable = gatewayRiskRaw.dataAvailable
  const sourcesUsed = [...geographicRisk.sourcesUsed, ...deviceRiskRaw.sourcesUsed, ...gatewayRiskRaw.sourcesUsed]

  const dimensionsWithData = [
    binDataAvailable,
    temporalDataAvailable,
    behavioralDataAvailable,
    geoDataAvailable,
    deviceDataAvailable,
    gatewayDataAvailable,
  ].filter(Boolean).length

  const ensembleConfidence = Math.round((dimensionsWithData / 6) * 100)

  const overallScore = normalizeScore(
    binRisk.score * WEIGHTS.binRisk +
      geographicRisk.score * WEIGHTS.geographicRisk +
      behavioralRisk.score * WEIGHTS.behavioralRisk +
      temporalRiskRaw.score * WEIGHTS.temporalRisk +
      deviceRiskRaw.score * WEIGHTS.deviceRisk +
      gatewayRiskRaw.score * WEIGHTS.gatewayRisk,
  )

  const riskLevel = getOverallRiskLevel(overallScore)
  const recommendation = getRecommendation(riskLevel, ensembleConfidence)

  return {
    binRisk: {
      score: binRisk.score,
      weight: WEIGHTS.binRisk,
      factors: binRisk.factors,
      explanation: {
        technical: "Score de risco do BIN baseado em análise 3DS inferida, reputação do emissor e nível do cartão.",
        popular: "Avalia o cartão: tipo, emissor e histórico de aprovação.",
      },
      dataAvailable: binDataAvailable,
    },
    temporalRisk: {
      score: temporalRiskRaw.score,
      weight: WEIGHTS.temporalRisk,
      factors: temporalRiskRaw.factors,
      explanation: {
        technical: `Risco temporal: hora ${temporalRiskRaw.hour}h, ${temporalRiskRaw.isWeekend ? "fim de semana" : "dia útil"}, ${temporalRiskRaw.isNightTime ? "período noturno" : "período diurno"}.`,
        popular: "Quando a compra aconteceu: madrugada e fim de semana aumentam o risco.",
      },
      dataAvailable: temporalDataAvailable,
    },
    behavioralRisk: {
      score: behavioralRisk.score,
      weight: WEIGHTS.behavioralRisk,
      factors: behavioralRisk.factors,
      explanation: {
        technical: behavioralDataAvailable
          ? `Análise comportamental com isFirstTransaction=${String(normalizedContext.isFirstTransaction)}.`
          : "Sem sinal comportamental disponível; score conservador aplicado.",
        popular: "Histórico de uso do cartão: primeira vez ou já conhecido.",
      },
      dataAvailable: behavioralDataAvailable,
    },
    geographicRisk: {
      score: geographicRisk.score,
      weight: WEIGHTS.geographicRisk,
      factors: geographicRisk.factors,
      explanation: {
        technical: `País do BIN ${binData.countryCode ?? "N/A"} (tier: ${geographicRisk.countryRiskTier}), IP country: ${geographicRisk.ipCountryCode ?? "N/A"}.`,
        popular: "De onde o cartão é e de onde parece estar sendo usado agora.",
      },
      dataAvailable: geoDataAvailable,
    },
    deviceRisk: {
      score: deviceRiskRaw.score,
      weight: WEIGHTS.deviceRisk,
      factors: deviceRiskRaw.factors,
      explanation: {
        technical: `Dispositivo detectado: ${deviceRiskRaw.deviceType}. UA presente: ${deviceDataAvailable}.`,
        popular: "Tipo de dispositivo: mobile, desktop, ou comportamento suspeito de bot.",
      },
      dataAvailable: deviceDataAvailable,
    },
    gatewayRisk: {
      score: gatewayRiskRaw.score,
      weight: WEIGHTS.gatewayRisk,
      factors: gatewayRiskRaw.factors,
      explanation: {
        technical: `Gateway: valor=${normalizedContext.amount ?? "N/A"} ${normalizedContext.currency ?? ""}, MCC=${normalizedContext.mcc ?? normalizedContext.merchantCategoryCode ?? "N/A"}.`,
        popular: "Valor da compra e tipo de estabelecimento influenciam o risco.",
      },
      dataAvailable: gatewayDataAvailable,
    },
    overallScore,
    riskLevel,
    recommendation,
    ensembleConfidence,
    sourcesUsed,
    peerComparison: buildPeerComparison(binData, binRisk.score, geographicRisk.score, geographicRisk.countryRiskTier),
  }
}
