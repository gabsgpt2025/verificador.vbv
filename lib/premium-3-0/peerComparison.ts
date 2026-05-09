/**
 * Peer Comparison — Comparação com dados reais do Supabase
 *
 * Substituiu a versão anterior que usava uma fórmula completamente inventada
 * (100 - binRisk×0.6 - geoRisk×0.4) com similarCount fixo em 240.
 *
 * Agora consulta `bin_analysis_logs` no Supabase para calcular percentis reais
 * baseados em análises dos últimos 30 dias do mesmo cohort (country + type + brand).
 *
 * Fallback: quando não há dados suficientes (< 10 análises no cohort),
 * usa estimativa heurística com disclaimer transparente.
 *
 * @module peerComparison
 */

import { getCountryRiskTier } from "./enrichment/geoEnrichment"
import type { BinApiData } from "./types"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

export interface PeerComparison {
  percentile: number
  description: string
  similarCount?: number
  cohortKey?: string
  peerCount?: number
  betterThan?: number
  peerGroup?: string
  dataSource: "SUPABASE_REAL" | "HEURISTIC_ESTIMATE"
}

const MIN_COHORT_SIZE = 10

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

/**
 * Computa peer comparison usando dados REAIS do Supabase quando disponíveis.
 *
 * @param binData - Dados do BIN analisado
 * @param supabase - Cliente Supabase (opcional; sem ele, usa heurística)
 * @param currentRiskScore - Score de risco da análise atual
 */
export async function computePeerComparison(
  binData: BinApiData,
  supabase?: SupabaseClient | null,
  currentRiskScore?: number,
): Promise<PeerComparison> {
  const cohortKey = `${binData.countryCode ?? "XX"}-${binData.type ?? "UNKNOWN"}-${(binData.brand ?? "UNKNOWN").toUpperCase()}`

  // Tentar consultar dados reais do Supabase
  if (supabase) {
    try {
      const result = await queryPeerData(supabase, binData, currentRiskScore)
      if (result) return { ...result, cohortKey }
    } catch (error) {
      console.warn("[peerComparison] Falha ao consultar Supabase, usando heurística:", error)
    }
  }

  // Fallback: estimativa heurística (transparente sobre a fonte)
  return computeHeuristicFallback(binData, cohortKey, currentRiskScore)
}

/**
 * Consulta bin_analysis_logs no Supabase para calcular percentis reais.
 */
async function queryPeerData(
  supabase: SupabaseClient,
  binData: BinApiData,
  currentRiskScore?: number,
): Promise<Omit<PeerComparison, "cohortKey"> | null> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Query: buscar scores de risco do mesmo cohort (country_code, card_type, brand)
  let query = supabase
    .from("bin_analysis_logs")
    .select("risk_score")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .not("risk_score", "is", null)

  if (binData.countryCode) {
    query = query.eq("country_code", binData.countryCode)
  }
  if (binData.type) {
    query = query.eq("card_type", binData.type)
  }
  if (binData.brand) {
    query = query.eq("brand", binData.brand)
  }

  // Limitar a 1000 registros mais recentes para performance
  query = query.order("created_at", { ascending: false }).limit(1000)

  const { data, error } = await query

  if (error) {
    console.warn("[peerComparison] Erro Supabase:", error.message)
    return null
  }

  if (!data || data.length < MIN_COHORT_SIZE) {
    return null // Dados insuficientes — volta para heurística
  }

  const scores: number[] = data
    .map((row: { risk_score: number | null }) => row.risk_score)
    .filter((s: number | null): s is number => typeof s === "number")
    .sort((a: number, b: number) => a - b)

  if (scores.length < MIN_COHORT_SIZE) {
    return null
  }

  // Calcular percentil do score atual no cohort
  const scoreToCompare = currentRiskScore ?? 50
  const belowCount = scores.filter((s: number) => s > scoreToCompare).length // Quanto MAIOR o risk_score, PIOR. Então "melhor que" = scores maiores
  const percentile = clamp(Math.round((belowCount / scores.length) * 100), 1, 99)
  const peerCount = scores.length

  const description =
    percentile >= 75
      ? `Melhor que ${percentile}% dos ${peerCount} cartões analisados neste cohort nos últimos 30 dias.`
      : percentile >= 40
        ? `Na média: melhor que ${percentile}% de ${peerCount} análises recentes neste cohort.`
        : `Abaixo da média: melhor que apenas ${percentile}% de ${peerCount} análises recentes.`

  return {
    percentile,
    description,
    similarCount: peerCount,
    peerCount,
    betterThan: percentile,
    peerGroup: `${binData.countryCode ?? "XX"}-${binData.type ?? "UNKNOWN"}-${(binData.brand ?? "UNKNOWN").toUpperCase()}`,
    dataSource: "SUPABASE_REAL",
  }
}

/**
 * Fallback heurístico quando dados reais não estão disponíveis.
 * Idêntica à lógica anterior, MAS com disclaimer explícito.
 */
function computeHeuristicFallback(
  binData: BinApiData,
  cohortKey: string,
  currentRiskScore?: number,
): PeerComparison {
  const countryRiskTier = getCountryRiskTier(binData.countryCode)
  const category = (binData.category ?? "").toUpperCase()
  const brand = (binData.brand ?? "").toUpperCase()

  let percentile: number
  switch (countryRiskTier) {
    case "TIER1":
      percentile = 70
      break
    case "TIER2":
      percentile = 55
      break
    case "CRITICAL":
      percentile = 25
      break
    default:
      percentile = 45
  }

  if (["BLACK", "PLATINUM", "SIGNATURE", "INFINITE", "WORLD ELITE"].some((entry) => category.includes(entry))) {
    percentile += 10
  }
  if (binData.isPrepaid) percentile -= 25
  if (category.includes("VIRTUAL")) percentile -= 10
  if (["BUSINESS", "CORPORATE", "COMMERCIAL"].some((entry) => category.includes(entry))) percentile -= 5
  if (["VISA", "MASTERCARD", "AMEX", "AMERICAN EXPRESS"].includes(brand)) percentile += 5

  // Se temos o riskScore atual, influenciar a estimativa
  if (typeof currentRiskScore === "number") {
    // Risk score baixo → melhor que mais peers
    const riskInfluence = Math.round((50 - currentRiskScore) * 0.3)
    percentile += riskInfluence
  }

  percentile = clamp(percentile, 1, 99)

  const description =
    percentile >= 75
      ? `Estimativa: melhor que ~${percentile}% dos cartões comparáveis (dados reais insuficientes).`
      : percentile >= 40
        ? `Estimativa: na média do mercado, ~${percentile}% dos cartões comparáveis (dados reais insuficientes).`
        : `Estimativa: abaixo da média, ~${percentile}% dos cartões comparáveis (dados reais insuficientes).`

  return {
    percentile,
    description,
    similarCount: 0,
    cohortKey,
    peerCount: 0,
    betterThan: percentile,
    peerGroup: cohortKey,
    dataSource: "HEURISTIC_ESTIMATE",
  }
}
