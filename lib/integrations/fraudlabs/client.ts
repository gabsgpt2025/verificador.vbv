/**
 * FraudLabs Pro — Client de integração
 *
 * Endpoint: https://api.fraudlabspro.com/v2/order/screen
 * Documentação: https://www.fraudlabspro.com/developer/api/screen-order
 *
 * Rate limits: Depende do plano. Micro plan = 500 queries/mês (free).
 * Cache: 24h por combinação (IP + BIN) — resultados de fraude mudam lentamente.
 */

import { getCache } from "@/lib/premium-3-0/runtime/cache"
import type { FraudLabsScreenResponse, FraudLabsResult } from "./types"

const FRAUDLABS_API_URL = "https://api.fraudlabspro.com/v2/order/screen"
const FRAUDLABS_TIMEOUT_MS = 5_000
const FRAUDLABS_CACHE_TTL_SECONDS = 24 * 60 * 60 // 24 horas
const FRAUDLABS_CACHE_PREFIX = "fraudlabs:screen:"

let disabledLogged = false

function getFraudLabsApiKey(): string | null {
  const key = process.env.FRAUDLABS_PRO_API_KEY?.trim()
  if (!key) {
    if (!disabledLogged) {
      console.info("[FRAUDLABS] Client disabled: missing FRAUDLABS_PRO_API_KEY")
      disabledLogged = true
    }
    return null
  }
  return key
}

function buildCacheKey(ip: string | undefined, bin: string | undefined): string {
  return `${FRAUDLABS_CACHE_PREFIX}${ip ?? "noip"}:${bin ?? "nobin"}`
}

function toBool(val: string | undefined): boolean {
  if (!val) return false
  return val.toUpperCase() === "Y" || val === "1" || val.toUpperCase() === "TRUE"
}

function normalizeResponse(raw: FraudLabsScreenResponse): FraudLabsResult {
  return {
    fraudScore: raw.fraudlabspro_score ?? 0,
    status: raw.fraudlabspro_status ?? "REVIEW",
    ipCountry: raw.ip_country || null,
    ipIsp: raw.ip_isp || null,
    isProxy: toBool(raw.is_proxy_ip_address),
    isCountryMatch: toBool(raw.is_country_match),
    isIpBlacklisted: toBool(raw.is_ip_blacklist),
    isHighRiskCountry: toBool(raw.is_high_risk_country),
    isBinFound: toBool(raw.is_bin_found),
    isBinPrepaid: toBool(raw.bin_prepaid),
    binCountry: raw.bin_country_code || raw.bin_country || null,
    binIssuer: raw.bin_name || null,
    creditsRemaining: raw.fraudlabspro_credits ?? -1,
    queriedAt: new Date().toISOString(),
    raw,
  }
}

export interface FraudLabsScreenInput {
  ip?: string
  bin?: string
  amount?: number
  currency?: string
}

/**
 * Consulta FraudLabs Pro para análise de fraude.
 * Retorna null se a API key não estiver configurada ou em caso de erro.
 */
export async function screenOrderFraudLabs(
  input: FraudLabsScreenInput,
): Promise<FraudLabsResult | null> {
  const apiKey = getFraudLabsApiKey()
  if (!apiKey) return null

  // Verifica cache primeiro
  const cache = getCache()
  const cacheKey = buildCacheKey(input.ip, input.bin)
  const cached = await cache.get<FraudLabsResult>(cacheKey)
  if (cached) {
    console.info("[FRAUDLABS] Cache hit", { cacheKey })
    return cached
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FRAUDLABS_TIMEOUT_MS)

  try {
    // Monta form data para a API
    const params = new URLSearchParams()
    params.set("key", apiKey)
    params.set("format", "json")

    if (input.ip) params.set("ip", input.ip)
    if (input.bin) params.set("bin_no", input.bin)
    if (input.amount !== undefined) params.set("amount", String(input.amount))
    if (input.currency) params.set("currency", input.currency)

    // Campos obrigatórios mínimos para a API funcionar
    params.set("order_id", `verifiBIN-${Date.now()}`)

    const response = await fetch(FRAUDLABS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      signal: controller.signal,
    })

    if (!response.ok) {
      console.error("[FRAUDLABS] API error", {
        status: response.status,
        statusText: response.statusText,
      })
      return null
    }

    const raw = (await response.json()) as FraudLabsScreenResponse

    // Verifica erros na resposta
    if (raw.fraudlabspro_error_code && raw.fraudlabspro_error_code !== "0") {
      console.error("[FRAUDLABS] API returned error", {
        code: raw.fraudlabspro_error_code,
        message: raw.fraudlabspro_error,
      })
      return null
    }

    const result = normalizeResponse(raw)

    // Salva no cache
    await cache.set(cacheKey, result, FRAUDLABS_CACHE_TTL_SECONDS)

    console.info("[FRAUDLABS] Screen completed", {
      score: result.fraudScore,
      status: result.status,
      creditsRemaining: result.creditsRemaining,
    })

    return result
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[FRAUDLABS] Request timeout", { timeoutMs: FRAUDLABS_TIMEOUT_MS })
    } else {
      console.error("[FRAUDLABS] Request failed", {
        error: error instanceof Error ? error.message : String(error),
      })
    }
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Verifica se o FraudLabs Pro está configurado e disponível.
 */
export function isFraudLabsEnabled(): boolean {
  return Boolean(process.env.FRAUDLABS_PRO_API_KEY?.trim())
}
