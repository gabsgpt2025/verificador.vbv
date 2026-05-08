import { analyzeThreeDS } from "./analyzeThreeDS"
import { calculateRisk } from "./calculateRisk"
import { calculateBankRisk } from "./enrichment/bankReputation"
import { calculateCardLevelRisk } from "./enrichment/cardLevelRisk"
import { enrichGeo, getCountryRiskTier } from "./enrichment/geoEnrichment"
import { enrichTemporal } from "./enrichment/temporalEnrichment"
import { enrichDevice } from "./enrichment/deviceEnrichment"
import { enrichGateway } from "./enrichment/gatewayRisk"
import type { BinApiData, BinRiskFactor } from "./types"

export interface TransactionContext {
  amount?: number
  currency?: string
  merchantCountry?: string
  merchantCategoryCode?: string
  mcc?: string
  merchantHost?: string
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
  peerComparison: { percentile: number; description: string }
  sourcesUsed?: string[]
  neutrinoContext?: {
    geographic: {
      ipCountryCode: string | null
      ipCity: string | null
      ipRegion: string | null
      ipIsHosting: boolean | null
      ipIsVpn: boolean | null
      ipIsProxy: boolean | null
      ipIsTor: boolean | null
      ipIsBogon: boolean | null
      ipBlocklistHits: string[]
    }
    device: {
      browserName: string | null
      browserVersion: string | null
      osName: string | null
      osVersion: string | null
      deviceModel: string | null
      deviceManufacturer: string | null
      isBot: boolean | null
      botCategory: string | null
    }
    gateway: {
      merchantHost: string | undefined
      hostReputation: number | null
      hostListed: boolean | null
      hostLists: string[] | null
    }
  }
}

export type HolisticContext = TransactionContext
export type HolisticRiskAnalysis = HolisticScore

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
  const historyCount = context.history?.length ?? 0

  if (historyCount >= 4) {
    return {
      score: 75,
      factors: [
        {
          label: "Alta velocidade transacional",
          impact: 35,
          reason: `Foram observadas ${historyCount} transações recentes no histórico informado.`,
        },
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

function buildTemporalRisk(timestamp: number) {
  const temporal = enrichTemporal(timestamp)
  const factors: BinRiskFactor[] = []
  let score = 20

  if (temporal.isNightTime) {
    score += 25
    factors.push({
      label: "Transação em horário noturno",
      impact: 25,
      reason: "Horários noturnos elevam risco operacional e probabilidade de fraude oportunista.",
    })
  }

  if (temporal.isWeekend) {
    score += 10
    factors.push({
      label: "Transação em fim de semana",
      impact: 10,
      reason: "Fins de semana costumam ter menor capacidade operacional de revisão manual.",
    })
  }

  if (temporal.isBusinessHours && !temporal.isNightTime) {
    score -= 5
    factors.push({
      label: "Horário comercial",
      impact: -5,
      reason: "Horário comercial tende a ter melhor previsibilidade e monitoramento.",
    })
  }

  return {
    ...temporal,
    score: normalizeScore(score),
    factors,
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

export async function runHolisticAnalysis(binData: BinApiData, context: Partial<TransactionContext>): Promise<HolisticScore> {
  const normalizedContext: Partial<TransactionContext> = {
    ...context,
    timestamp: typeof context?.timestamp === "number" ? context.timestamp : 0,
  }

  const binRisk = buildBinRisk(binData, normalizedContext)
  const temporalRiskRaw = buildTemporalRisk(normalizedContext.timestamp ?? 0)
  const behavioralRisk = buildBehavioralRisk(normalizedContext)

  const [geographicRisk, deviceRiskRaw, gatewayRiskRaw] = await Promise.all([
    enrichGeo(binData.countryCode ?? "", normalizedContext.ipAddress ?? null, normalizedContext.ipCountryCode ?? null),
    enrichDevice(normalizedContext.userAgent),
    enrichGateway({
      amount: normalizedContext.amount,
      currency: normalizedContext.currency,
      mcc: normalizedContext.mcc ?? normalizedContext.merchantCategoryCode,
      merchantHost: normalizedContext.merchantHost,
    }),
  ])

  const sourcesUsed = [
    ...(geographicRisk.sourcesUsed ?? []),
    ...(deviceRiskRaw.sourcesUsed ?? []),
    ...(gatewayRiskRaw.sourcesUsed ?? []),
  ]

  const binDataAvailable = Boolean(binData.brand || binData.countryCode || binData.issuer)
  const temporalDataAvailable = (normalizedContext.timestamp ?? 0) > 0
  const behavioralDataAvailable = typeof normalizedContext.isFirstTransaction === "boolean" || (normalizedContext.history?.length ?? 0) > 0
  const geoDataAvailable = Boolean(binData.countryCode || normalizedContext.ipCountryCode || geographicRisk.ipCountryCode)
  const deviceDataAvailable = Boolean(normalizedContext.userAgent)
  const gatewayDataAvailable = gatewayRiskRaw.dataAvailable

  const dimensionsWithData = [
    binDataAvailable,
    temporalDataAvailable,
    behavioralDataAvailable,
    geoDataAvailable,
    deviceDataAvailable,
    gatewayDataAvailable,
  ].filter(Boolean).length

  const confidenceBoost = Math.min(25, sourcesUsed.length * 5)
  const ensembleConfidence = Math.min(100, Math.round((dimensionsWithData / 6) * 100) + confidenceBoost)

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
    peerComparison: buildPeerComparison(binData, binRisk.score, geographicRisk.score, geographicRisk.countryRiskTier),
    sourcesUsed,
    neutrinoContext: {
      geographic: {
        ipCountryCode: geographicRisk.ipCountryCode ?? null,
        ipCity: geographicRisk.ipCity ?? null,
        ipRegion: geographicRisk.ipRegion ?? null,
        ipIsHosting: geographicRisk.ipIsHosting ?? null,
        ipIsVpn: geographicRisk.ipIsVpn ?? null,
        ipIsProxy: geographicRisk.ipIsProxy ?? null,
        ipIsTor: geographicRisk.ipIsTor ?? null,
        ipIsBogon: geographicRisk.ipIsBogon ?? null,
        ipBlocklistHits: geographicRisk.ipBlocklistHits ?? [],
      },
      device: {
        browserName: deviceRiskRaw.browserName ?? null,
        browserVersion: deviceRiskRaw.browserVersion ?? null,
        osName: deviceRiskRaw.osName ?? null,
        osVersion: deviceRiskRaw.osVersion ?? null,
        deviceModel: deviceRiskRaw.deviceModel ?? null,
        deviceManufacturer: deviceRiskRaw.deviceManufacturer ?? null,
        isBot: deviceRiskRaw.isBot ?? null,
        botCategory: deviceRiskRaw.botCategory ?? null,
      },
      gateway: {
        merchantHost: normalizedContext.merchantHost,
        hostReputation: gatewayRiskRaw.hostReputation ?? null,
        hostListed: gatewayRiskRaw.hostListed ?? null,
        hostLists: gatewayRiskRaw.hostLists ?? null,
      },
    },
  }
}
