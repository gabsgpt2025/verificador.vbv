import { analyzeThreeDS } from "./analyzeThreeDS"
import { calculateRisk } from "./calculateRisk"
import { buildBankReputationFactors, lookupBankReputation } from "./enrichment/bankReputation"
import { calculateCardLevelRisk } from "./enrichment/cardLevelRisk"
import { enrichDevice } from "./enrichment/deviceEnrichment"
import { enrichGateway } from "./enrichment/gatewayRisk"
import { enrichGeo } from "./enrichment/geoEnrichment"
import { enrichTemporal } from "./enrichment/temporalEnrichment"
import type { RecommendationAction, RiskLevel } from "./holisticTypes"
import type { BinApiData, BinRiskFactor } from "./types"

export interface HolisticContext {
  amount?: number
  currency?: string
  merchantCountry?: string
  mcc?: string
  timestamp: number
  userAgent?: string | null
  ipAddress?: string | null
  ipCountryCode?: string | null
  isFirstTransaction?: boolean
}

export interface DimensionScore {
  score: number
  weight: number
  factors: BinRiskFactor[]
  explanation: { technical: string; popular: string }
  dataAvailable: boolean
}

export interface HolisticRiskAnalysis {
  overallScore: number
  level: RiskLevel
  recommendation: RecommendationAction
  dimensions: {
    binRisk: DimensionScore
    temporalRisk: DimensionScore
    behavioralRisk: DimensionScore
    geographicRisk: DimensionScore
    deviceRisk: DimensionScore
    gatewayRisk: DimensionScore
  }
  ensembleConfidence: number
}

export const BANK_REP_WEIGHT = 0.6
export const CARD_LEVEL_WEIGHT = 0.4

export const HOLISTIC_DIMENSION_WEIGHTS = {
  binRisk: 30,
  geographicRisk: 20,
  behavioralRisk: 15,
  gatewayRisk: 15,
  temporalRisk: 10,
  deviceRisk: 10,
} as const
const TOTAL_WEIGHT = Object.values(HOLISTIC_DIMENSION_WEIGHTS).reduce((sum, value) => sum + value, 0)

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 85) return "CRITICAL"
  if (score >= 60) return "HIGH"
  if (score >= 35) return "MEDIUM"
  return "LOW"
}

function getRecommendation(score: number): RecommendationAction {
  if (score >= 80) return "DECLINE"
  if (score >= 60) return "CHALLENGE"
  if (score >= 35) return "REVIEW"
  return "APPROVE"
}

function baselineDimension(weight: number, technical: string, popular: string): DimensionScore {
  return {
    score: 30,
    weight,
    factors: [{ label: "Dados ausentes", impact: 0, reason: technical }],
    explanation: { technical, popular },
    dataAvailable: false,
  }
}

function composeBehavioralDimension(binData: BinApiData, context: HolisticContext): DimensionScore {
  const hasBankData = Boolean(binData.issuer || binData.countryCode)
  const hasCardData = Boolean(binData.type || binData.category || binData.isPrepaid)
  const dataAvailable = hasBankData || hasCardData

  if (!dataAvailable) {
    return baselineDimension(
      HOLISTIC_DIMENSION_WEIGHTS.behavioralRisk,
      "Sem sinais de reputação bancária ou nível de cartão.",
      "Não havia histórico suficiente do banco/cartão para medir comportamento.",
    )
  }

  const bankRep = lookupBankReputation(binData.issuer ?? null, binData.countryCode ?? null)
  const cardRisk = calculateCardLevelRisk(binData)
  const firstTransactionBoost = context.isFirstTransaction ? 10 : 0
  const score = clamp(bankRep.score * BANK_REP_WEIGHT + cardRisk.score * CARD_LEVEL_WEIGHT + firstTransactionBoost, 0, 100)
  const factors: BinRiskFactor[] = [...buildBankReputationFactors(binData.issuer, binData.countryCode), ...cardRisk.factors]

  if (context.isFirstTransaction) {
    factors.push({
      label: "Primeira transação",
      impact: 10,
      reason: "Sem histórico da conta/cartão para esse fluxo, risco comportamental sobe moderadamente.",
    })
  }

  return {
    score,
    weight: HOLISTIC_DIMENSION_WEIGHTS.behavioralRisk,
    factors,
    explanation: {
      technical: "Combina reputação histórica do emissor com perfil do produto (pré-pago, virtual, business, nível premium).",
      popular: "Olha quem emitiu o cartão e o tipo de cartão para estimar risco de comportamento.",
    },
    dataAvailable: true,
  }
}

export function runHolisticAnalysis(binData: BinApiData, context: HolisticContext): HolisticRiskAnalysis {
  const threeDS = analyzeThreeDS(binData, { amount: context.amount, currency: context.currency })
  const coreRisk = calculateRisk(binData, threeDS)
  const binHasData = Boolean(binData.brand || binData.countryCode || binData.issuer)
  const binRisk: DimensionScore = binHasData
    ? {
        score: coreRisk.score,
        weight: HOLISTIC_DIMENSION_WEIGHTS.binRisk,
        factors: coreRisk.factors,
        explanation: {
          technical: "Score base do BIN usando consistência cadastral, maturidade 3DS e heurísticas de risco central.",
          popular: "Mostra o risco principal do cartão pelo BIN e dados bancários retornados.",
        },
        dataAvailable: true,
      }
    : baselineDimension(
        HOLISTIC_DIMENSION_WEIGHTS.binRisk,
        "Dados centrais de BIN insuficientes para score robusto.",
        "Faltam dados básicos do cartão para avaliar esse bloco com confiança.",
      )

  const temporal = enrichTemporal(context.timestamp)
  const temporalRisk: DimensionScore = {
    score: temporal.score,
    weight: HOLISTIC_DIMENSION_WEIGHTS.temporalRisk,
    factors: temporal.factors,
    explanation: {
      technical: "Heurística determinística por hora/dia da semana com ajustes para madrugada e noites de sexta/sábado.",
      popular: "Considera o horário da compra para detectar momentos mais arriscados.",
    },
    dataAvailable: true,
  }

  const geo = enrichGeo(binData.countryCode ?? null, context.ipAddress ?? null, context.ipCountryCode ?? null)
  const geographicRisk: DimensionScore =
    geo.binCountry || geo.ipCountry
      ? {
          score: geo.score,
          weight: HOLISTIC_DIMENSION_WEIGHTS.geographicRisk,
          factors: geo.factors,
          explanation: {
            technical: "Classifica risco por país emissor e adiciona +25 em divergência BIN vs país do IP.",
            popular: "Compara país do cartão com país do IP e usa tier de risco geográfico.",
          },
          dataAvailable: true,
        }
      : baselineDimension(
          HOLISTIC_DIMENSION_WEIGHTS.geographicRisk,
          "Sem país do BIN e sem país de IP para cruzamento geográfico.",
          "Não havia dados de localização para esse bloco.",
        )

  const device = enrichDevice(context.userAgent ?? null)
  const deviceRisk: DimensionScore = context.userAgent
    ? {
        score: device.score,
        weight: HOLISTIC_DIMENSION_WEIGHTS.deviceRisk,
        factors: device.factors,
        explanation: {
          technical: "Parser leve de User-Agent detecta browser, tipo de dispositivo e padrões bot/headless.",
          popular: "Analisa o aparelho/navegador e alerta quando parece automação.",
        },
        dataAvailable: true,
      }
    : baselineDimension(
        HOLISTIC_DIMENSION_WEIGHTS.deviceRisk,
        "User-Agent ausente; dimensão de dispositivo em baseline neutro.",
        "Sem dados do dispositivo para avaliar esse bloco.",
      )

  const hasGatewayData = typeof context.amount === "number" || Boolean(context.currency) || Boolean(context.mcc)
  const gateway = enrichGateway({ amount: context.amount, currency: context.currency, mcc: context.mcc })
  const gatewayRisk: DimensionScore = hasGatewayData
    ? {
        score: gateway.score,
        weight: HOLISTIC_DIMENSION_WEIGHTS.gatewayRisk,
        factors: gateway.factors,
        explanation: {
          technical: "Regras por valor, moeda e MCC (7995/6051) para pressão de risco no gateway.",
          popular: "Considera valor da compra e tipo do comércio para medir risco adicional.",
        },
        dataAvailable: true,
      }
    : baselineDimension(
        HOLISTIC_DIMENSION_WEIGHTS.gatewayRisk,
        "Sem valor/moeda/MCC para regras de gateway.",
        "Não havia dados da compra para esse bloco.",
      )

  const behavioralRisk = composeBehavioralDimension(binData, context)

  const dimensions: HolisticRiskAnalysis["dimensions"] = {
    binRisk,
    temporalRisk,
    behavioralRisk,
    geographicRisk,
    deviceRisk,
    gatewayRisk,
  }

  const weightedScore =
    dimensions.binRisk.score * dimensions.binRisk.weight +
    dimensions.geographicRisk.score * dimensions.geographicRisk.weight +
    dimensions.behavioralRisk.score * dimensions.behavioralRisk.weight +
    dimensions.gatewayRisk.score * dimensions.gatewayRisk.weight +
    dimensions.temporalRisk.score * dimensions.temporalRisk.weight +
    dimensions.deviceRisk.score * dimensions.deviceRisk.weight

  const overallScore = clamp(weightedScore / 100, 0, 100)
  const availableWeight = Object.values(dimensions)
    .filter((dimension) => dimension.dataAvailable)
    .reduce((sum, dimension) => sum + dimension.weight, 0)
  const coverage = availableWeight / TOTAL_WEIGHT
  const dispersion =
    (Math.abs(dimensions.binRisk.score - overallScore) +
      Math.abs(dimensions.geographicRisk.score - overallScore) +
      Math.abs(dimensions.behavioralRisk.score - overallScore) +
      Math.abs(dimensions.gatewayRisk.score - overallScore) +
      Math.abs(dimensions.temporalRisk.score - overallScore) +
      Math.abs(dimensions.deviceRisk.score - overallScore)) /
    6
  const ensembleConfidence = clamp(55 + coverage * 35 - dispersion * 0.2, 0, 100)

  return {
    overallScore,
    level: getRiskLevel(overallScore),
    recommendation: getRecommendation(overallScore),
    dimensions,
    ensembleConfidence,
  }
}
