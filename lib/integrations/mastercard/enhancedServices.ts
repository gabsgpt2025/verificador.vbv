/**
 * Mastercard Enhanced Services — Identity Check & Fraud Scoring
 *
 * Expande a integração Mastercard além do BIN Lookup básico.
 * Usa o mesmo mecanismo de autenticação OAuth 1.0a do binLookupClient.
 *
 * APIs disponíveis no sandbox:
 * - Identity Insights: /idverify/identity-insights/v1
 * - Fraud Scoring: /fraud/merchant/v3/score  
 *
 * NOTA: Estas APIs podem ter limitações no sandbox. Implementamos com fallback
 * gracioso quando não disponíveis.
 */

import { getCache } from "@/lib/premium-3-0/runtime/cache"
import { loadPrivateKeyFromEnv, signRequest } from "./oauthSigner"

const MASTERCARD_DEFAULT_BASE_URL = "https://sandbox.api.mastercard.com"
const MASTERCARD_TIMEOUT_MS = 5_000
const MASTERCARD_CACHE_TTL_SECONDS = 12 * 60 * 60 // 12 horas

let disabledLogged = false

// ============================================================================
// Types
// ============================================================================

export interface MastercardIdentityResult {
  /** Score de confiança da identidade (0-100) */
  identityScore: number
  /** Indicadores de risco encontrados */
  riskIndicators: string[]
  /** Recomendação */
  recommendation: "APPROVE" | "REVIEW" | "DECLINE"
  /** Fonte */
  source: "MASTERCARD_IDENTITY"
  /** Timestamp */
  queriedAt: string
}

export interface MastercardFraudScoreResult {
  /** Score de fraude (0-999, menor = menos risco) */
  fraudScore: number
  /** Score normalizado para 0-100 (para compatibilidade) */
  fraudScoreNormalized: number
  /** Código de razão do score */
  reasonCodes: string[]
  /** Nível de risco */
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  /** Fonte */
  source: "MASTERCARD_FRAUD"
  /** Timestamp */
  queriedAt: string
}

// ============================================================================
// Helpers
// ============================================================================

function getMastercardConfig() {
  const consumerKey = process.env.MASTERCARD_CONSUMER_KEY?.trim()
  const privateKeyPem = loadPrivateKeyFromEnv()
  const apiBase = (process.env.MASTERCARD_API_BASE?.trim() || MASTERCARD_DEFAULT_BASE_URL).replace(/\/+$/, "")

  if (!consumerKey || !privateKeyPem) {
    if (!disabledLogged) {
      console.info("[MASTERCARD:ENHANCED] Client disabled: missing credentials")
      disabledLogged = true
    }
    return null
  }

  return { consumerKey, privateKeyPem, apiBase }
}

async function mastercardRequest<T>(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>,
): Promise<T | null> {
  const config = getMastercardConfig()
  if (!config) return null

  const url = `${config.apiBase}${path}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), MASTERCARD_TIMEOUT_MS)

  try {
    const { authorizationHeader } = signRequest({
      consumerKey: config.consumerKey,
      privateKeyPem: config.privateKeyPem,
      method,
      url,
      body: body ? JSON.stringify(body) : undefined,
    })

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: authorizationHeader,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    })

    if (!response.ok) {
      console.warn(`[MASTERCARD:ENHANCED] ${path} returned ${response.status}`, {
        status: response.status,
      })
      return null
    }

    return (await response.json()) as T
  } catch (error) {
    console.warn(`[MASTERCARD:ENHANCED] ${path} failed`, {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  } finally {
    clearTimeout(timeout)
  }
}

// ============================================================================
// Identity Insights
// ============================================================================

interface IdentityInsightsApiResponse {
  transactionIndicator?: {
    score?: number
    recommendation?: string
    indicators?: string[]
  }
  [key: string]: unknown
}

/**
 * Consulta Mastercard Identity Insights para verificação de identidade.
 * Retorna null se não disponível ou em caso de erro.
 */
export async function fetchMastercardIdentityInsights(input: {
  bin: string
  ipAddress?: string
  countryCode?: string
}): Promise<MastercardIdentityResult | null> {
  const cache = getCache()
  const cacheKey = `mastercard:identity:${input.bin}`
  const cached = await cache.get<MastercardIdentityResult>(cacheKey)
  if (cached) return cached

  const raw = await mastercardRequest<IdentityInsightsApiResponse>(
    "/idverify/identity-insights/v1/card-verification",
    "POST",
    {
      requestId: `verifiBIN-${Date.now()}`,
      accountNumber: input.bin.padEnd(16, "0"), // Pad BIN to 16 digits for sandbox
      ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
      ...(input.countryCode ? { countryCode: input.countryCode } : {}),
    },
  )

  if (!raw) return null

  const indicator = raw.transactionIndicator
  const score = indicator?.score ?? 50
  const recommendation =
    score >= 70 ? "APPROVE" : score >= 40 ? "REVIEW" : "DECLINE"

  const result: MastercardIdentityResult = {
    identityScore: score,
    riskIndicators: indicator?.indicators ?? [],
    recommendation,
    source: "MASTERCARD_IDENTITY",
    queriedAt: new Date().toISOString(),
  }

  await cache.set(cacheKey, result, MASTERCARD_CACHE_TTL_SECONDS)
  console.info("[MASTERCARD:IDENTITY] Query completed", { score, recommendation })
  return result
}

// ============================================================================
// Fraud Scoring
// ============================================================================

interface FraudScoringApiResponse {
  score?: number
  reasonCodes?: Array<{ code: string; description?: string }>
  [key: string]: unknown
}

/**
 * Consulta Mastercard Fraud Scoring para obter score de fraude.
 * Retorna null se não disponível ou em caso de erro.
 */
export async function fetchMastercardFraudScore(input: {
  bin: string
  amount?: number
  currency?: string
  merchantCountry?: string
}): Promise<MastercardFraudScoreResult | null> {
  const cache = getCache()
  const cacheKey = `mastercard:fraud:${input.bin}:${input.amount ?? 0}:${input.currency ?? "USD"}`
  const cached = await cache.get<MastercardFraudScoreResult>(cacheKey)
  if (cached) return cached

  const raw = await mastercardRequest<FraudScoringApiResponse>(
    "/fraud/merchant/v3/score",
    "POST",
    {
      accountNumber: input.bin.padEnd(16, "0"),
      transactionAmount: input.amount ?? 0,
      transactionCurrency: input.currency ?? "USD",
      ...(input.merchantCountry ? { merchantCountry: input.merchantCountry } : {}),
    },
  )

  if (!raw) return null

  const rawScore = raw.score ?? 500
  // Normaliza score de 0-999 para 0-100
  const normalizedScore = Math.round((rawScore / 999) * 100)
  const riskLevel: "LOW" | "MEDIUM" | "HIGH" =
    normalizedScore <= 30 ? "LOW" : normalizedScore <= 60 ? "MEDIUM" : "HIGH"

  const result: MastercardFraudScoreResult = {
    fraudScore: rawScore,
    fraudScoreNormalized: normalizedScore,
    reasonCodes: raw.reasonCodes?.map((r) => r.code) ?? [],
    riskLevel,
    source: "MASTERCARD_FRAUD",
    queriedAt: new Date().toISOString(),
  }

  await cache.set(cacheKey, result, MASTERCARD_CACHE_TTL_SECONDS)
  console.info("[MASTERCARD:FRAUD] Score completed", { rawScore, normalizedScore, riskLevel })
  return result
}

/**
 * Verifica se os serviços avançados da Mastercard estão configurados.
 */
export function isMastercardEnhancedEnabled(): boolean {
  return Boolean(
    process.env.MASTERCARD_CONSUMER_KEY?.trim() &&
    loadPrivateKeyFromEnv(),
  )
}
