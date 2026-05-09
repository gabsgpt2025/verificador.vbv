import { analyzeThreeDS } from "./analyzeThreeDS"
import { calculateRisk } from "./calculateRisk"
import { calculateBankRisk } from "./enrichment/bankReputation"
import { calculateCardLevelRisk } from "./enrichment/cardLevelRisk"
import { enrichGeo, getCountryRiskTier } from "./enrichment/geoEnrichment"
import { enrichTemporal } from "./enrichment/temporalEnrichment"
import { enrichDevice } from "./enrichment/deviceEnrichment"
import { enrichGateway } from "./enrichment/gatewayRisk"
import type { BinApiData, BinRiskFactor, RiskContext } from "./types"
import type { EnrichedAnalysisResult } from "./services/enrichedAnalysisService"

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
  /** Dimensão adicional: risco da sessão/rede (quando dados de IP/UA disponíveis via APIs) */
  externalApiRisk?: HolisticDimensionScore
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

// ============================================================================
// External API Risk Dimension (FASE 2)
// ============================================================================

/**
 * Constrói a dimensão de risco baseada em dados de APIs externas (Neutrino session,
 * FraudLabs Pro, Mastercard Identity/Fraud). Essa dimensão é optional — só é
 * incluída quando há dados de enriquecimento disponíveis.
 */
function buildExternalApiRisk(
  enriched: EnrichedAnalysisResult | undefined,
): HolisticDimensionScore | null {
  if (!enriched) return null

  const factors: BinRiskFactor[] = []
  let score = 20 // base score neutral
  let hasData = false

  // ── Session Risk (Neutrino) ──
  if (enriched.sessionRisk) {
    hasData = true
    const sr = enriched.sessionRisk

    // Incorpora o score da sessão (ponderado)
    const sessionWeight = 0.4
    score += Math.round((sr.riskScore - 20) * sessionWeight)

    if (sr.network.isTor) {
      factors.push({
        label: "Rede TOR detectada (Neutrino)",
        impact: 25,
        reason: "IP identificado como nó TOR via Neutrino ip-info/blocklist.",
      })
    }
    if (sr.network.isVpn) {
      factors.push({
        label: "VPN detectada (Neutrino)",
        impact: 15,
        reason: "IP identificado como VPN via Neutrino ip-info.",
      })
    }
    if (sr.network.isProxy) {
      factors.push({
        label: "Proxy público detectado (Neutrino)",
        impact: 12,
        reason: "IP classificado como proxy público.",
      })
    }
    if (sr.device.isBot) {
      factors.push({
        label: "Bot detectado via UA-Lookup (Neutrino)",
        impact: 20,
        reason: "User-Agent classificado como bot/automação pelo Neutrino ua-lookup.",
      })
    }
    if (sr.hostReputation?.listed) {
      factors.push({
        label: "Hostname com reputação negativa (Neutrino)",
        impact: 10,
        reason: "O hostname do IP consta em listas de reputação negativa.",
      })
    }
  }

  // ── IP Probe (Neutrino advanced) ──
  if (enriched.ipProbe) {
    hasData = true
    const probe = enriched.ipProbe
    if (probe.is_vpn && !enriched.sessionRisk?.network.isVpn) {
      score += 10
      factors.push({
        label: "VPN confirmada por IP Probe (Neutrino)",
        impact: 10,
        reason: "Detecção avançada de VPN via Neutrino ip-probe.",
      })
    }
    if (probe.is_hosting) {
      score += 8
      factors.push({
        label: "IP de hosting/datacenter (Neutrino ip-probe)",
        impact: 8,
        reason: "IP associado a servidor de hosting — não é IP residencial.",
      })
    }
  }

  // ── FraudLabs Pro ──
  if (enriched.fraudLabs) {
    hasData = true
    const fl = enriched.fraudLabs
    const fraudWeight = 0.35
    score += Math.round((fl.fraudScore - 20) * fraudWeight)

    if (fl.fraudScore >= 70) {
      factors.push({
        label: `FraudLabs Pro: alto risco (score ${fl.fraudScore})`,
        impact: 20,
        reason: "FraudLabs Pro classificou esta transação com score de fraude elevado.",
      })
    } else if (fl.fraudScore >= 40) {
      factors.push({
        label: `FraudLabs Pro: risco moderado (score ${fl.fraudScore})`,
        impact: 10,
        reason: "FraudLabs Pro detectou indicadores moderados de fraude.",
      })
    } else {
      factors.push({
        label: `FraudLabs Pro: baixo risco (score ${fl.fraudScore})`,
        impact: -5,
        reason: "FraudLabs Pro não encontrou indicadores significativos de fraude.",
      })
    }

    if (fl.isIpBlacklisted) {
      score += 15
      factors.push({
        label: "IP em blacklist (FraudLabs Pro)",
        impact: 15,
        reason: "O IP está na blacklist do FraudLabs Pro.",
      })
    }
    if (!fl.isCountryMatch && fl.ipCountry && fl.binCountry) {
      score += 10
      factors.push({
        label: "País do IP ≠ País do BIN (FraudLabs Pro)",
        impact: 10,
        reason: `País do IP (${fl.ipCountry}) difere do país do BIN (${fl.binCountry}).`,
      })
    }
    if (fl.isProxy) {
      score += 5
      factors.push({
        label: "Proxy detectado (FraudLabs Pro)",
        impact: 5,
        reason: "FraudLabs Pro identificou uso de proxy.",
      })
    }
  }

  // ── Mastercard Fraud Score ──
  if (enriched.mastercardFraud) {
    hasData = true
    const mf = enriched.mastercardFraud
    const mcWeight = 0.25
    score += Math.round((mf.fraudScoreNormalized - 20) * mcWeight)

    factors.push({
      label: `Mastercard Fraud Score: ${mf.riskLevel} (${mf.fraudScoreNormalized}/100)`,
      impact: mf.fraudScoreNormalized > 50 ? 15 : mf.fraudScoreNormalized > 30 ? 5 : -5,
      reason: `Mastercard classificou com fraud score ${mf.fraudScore}/999 (normalizado: ${mf.fraudScoreNormalized}/100).`,
    })
  }

  // ── Mastercard Identity ──
  if (enriched.mastercardIdentity) {
    hasData = true
    const mi = enriched.mastercardIdentity
    if (mi.recommendation === "DECLINE") {
      score += 15
      factors.push({
        label: "Mastercard Identity: DECLINE",
        impact: 15,
        reason: "Mastercard Identity Insights recomendou declínio desta transação.",
      })
    } else if (mi.recommendation === "REVIEW") {
      score += 5
      factors.push({
        label: "Mastercard Identity: REVIEW",
        impact: 5,
        reason: "Mastercard Identity Insights recomendou revisão manual.",
      })
    } else {
      factors.push({
        label: "Mastercard Identity: APPROVE",
        impact: -5,
        reason: "Mastercard Identity Insights aprovou esta transação.",
      })
    }
  }

  if (!hasData) return null

  return {
    score: clamp(score, 0, 100),
    weight: 0, // Weight is managed by the caller
    factors,
    explanation: {
      technical: "Score composto a partir de APIs externas: Neutrino (session/ip-probe), FraudLabs Pro, Mastercard (identity/fraud).",
      popular: "Análise combinada de múltiplas APIs de detecção de fraude e verificação de identidade.",
    },
    dataAvailable: hasData,
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

/**
 * Executa a análise holística do BIN, combinando 6 dimensões base + dimensão
 * opcional de APIs externas (FASE 2).
 *
 * @param binData Dados do BIN normalizados
 * @param context Contexto da transação
 * @param enriched (Opcional) Resultado do enriquecimento via APIs externas (FASE 2)
 */
export function runHolisticAnalysis(
  binData: BinApiData,
  context: Partial<TransactionContext>,
  enriched?: EnrichedAnalysisResult,
): HolisticScore {
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

  // ── FASE 2: External API Risk Dimension ──
  const externalApiRiskDim = buildExternalApiRisk(enriched)
  const externalApiDataAvailable = Boolean(externalApiRiskDim?.dataAvailable)

  // Adiciona fontes das APIs externas
  if (enriched?.apiDiagnostics) {
    for (const diag of enriched.apiDiagnostics) {
      if (diag.status === "success") {
        sourcesUsed.push(diag.api)
      }
    }
  }

  const dimensionsWithData = [
    binDataAvailable,
    temporalDataAvailable,
    behavioralDataAvailable,
    geoDataAvailable,
    deviceDataAvailable,
    gatewayDataAvailable,
    externalApiDataAvailable,
  ].filter(Boolean).length

  // Total dimensions adjusts if external API data is available (7 vs 6)
  const totalDimensions = externalApiDataAvailable ? 7 : 6
  const ensembleConfidence = Math.round((dimensionsWithData / totalDimensions) * 100)

  // Pesos dinâmicos: quando dados de API externa estão disponíveis,
  // redistribui os pesos para incluir a nova dimensão (15% para external API).
  let overallScore: number
  if (externalApiRiskDim && externalApiDataAvailable) {
    // Redistribui: reduz levemente geo e behavioral para dar espaço à external API
    const adjustedWeights = {
      binRisk: 0.25,
      geographicRisk: 0.15,
      behavioralRisk: 0.12,
      temporalRisk: 0.08,
      deviceRisk: 0.12,
      gatewayRisk: 0.08,
      externalApi: 0.20,
    }
    overallScore = normalizeScore(
      binRisk.score * adjustedWeights.binRisk +
        geographicRisk.score * adjustedWeights.geographicRisk +
        behavioralRisk.score * adjustedWeights.behavioralRisk +
        temporalRiskRaw.score * adjustedWeights.temporalRisk +
        deviceRiskRaw.score * adjustedWeights.deviceRisk +
        gatewayRiskRaw.score * adjustedWeights.gatewayRisk +
        externalApiRiskDim.score * adjustedWeights.externalApi,
    )
  } else {
    overallScore = normalizeScore(
      binRisk.score * WEIGHTS.binRisk +
        geographicRisk.score * WEIGHTS.geographicRisk +
        behavioralRisk.score * WEIGHTS.behavioralRisk +
        temporalRiskRaw.score * WEIGHTS.temporalRisk +
        deviceRiskRaw.score * WEIGHTS.deviceRisk +
        gatewayRiskRaw.score * WEIGHTS.gatewayRisk,
    )
  }

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
    // ── FASE 2: External API Risk (opcional) ──
    ...(externalApiRiskDim ? {
      externalApiRisk: {
        ...externalApiRiskDim,
        weight: externalApiDataAvailable ? 0.20 : 0,
      },
    } : {}),
    overallScore,
    riskLevel,
    recommendation,
    ensembleConfidence,
    sourcesUsed,
    peerComparison: buildPeerComparison(binData, binRisk.score, geographicRisk.score, geographicRisk.countryRiskTier),
  }
}
