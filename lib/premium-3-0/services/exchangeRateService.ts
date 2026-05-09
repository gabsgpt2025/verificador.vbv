/**
 * ExchangeRateService — SSOT (Single Source of Truth) para taxas de câmbio
 *
 * Substitui as taxas estáticas duplicadas que existiam em:
 *   - analyzeThreeDS.ts (EUR_EXCHANGE_RATE, 6 moedas)
 *   - enrichment/gatewayRisk.ts (EUR_EXCHANGE_RATE + BRL_EXCHANGE_RATE, 6+6 moedas)
 *   - currencyConverter.ts (EXCHANGE_RATES, 30 moedas)
 *
 * Fontes de dados (ordem de prioridade):
 *   1. Cache em memória fresco (evita round-trip Redis)
 *   2. Upstash Redis (se UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN estiverem definidos)
 *      - Chave: `exchange_rates:usd`, TTL: 3600 segundos
 *      - Permite compartilhamento de cache entre instâncias serverless/Vercel
 *   3. API real: ExchangeRate-API Open Access (https://open.er-api.com/v6/latest/USD)
 *      - Gratuita, sem API key, atualização diária
 *   4. Cache em memória stale (fallback)
 *   5. Último recurso: taxas estáticas de emergência (snapshot 2026-05-09)
 *
 * Se o Redis não estiver configurado ou falhar, o serviço degrada graciosamente
 * para o comportamento anterior (in-memory cache + fallback estático).
 *
 * @module exchangeRateService
 */

import { Redis } from "@upstash/redis"

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface ExchangeRates {
  base: string
  rates: Record<string, number>
  source: "API_REALTIME" | "CACHE" | "STALE_CACHE" | "STATIC_FALLBACK"
  lastUpdated: string
  nextUpdate?: string
}

interface CacheEntry {
  rates: Record<string, number>
  fetchedAt: number
  lastUpdated: string
  nextUpdate?: string
}

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

const API_URL = "https://open.er-api.com/v6/latest/USD"
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hora
const FETCH_TIMEOUT_MS = 8_000 // 8 segundos
const REDIS_CACHE_KEY = "exchange_rates:usd"
const REDIS_TTL_SECS = 3600 // 1 hora

// ---------------------------------------------------------------------------
// Upstash Redis (opcional — degrada graciosamente se não configurado)
// ---------------------------------------------------------------------------

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

// ---------------------------------------------------------------------------
// Cache em memória (módulo-level singleton)
// ---------------------------------------------------------------------------

let memoryCache: CacheEntry | null = null

// ---------------------------------------------------------------------------
// Fallback estático de emergência — snapshot 2026-05-09
// Usado APENAS quando a API está inacessível E não há cache disponível.
// Estas taxas são aproximações e NÃO devem ser usadas como fonte primária.
// ---------------------------------------------------------------------------

const STATIC_FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 155.0,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
  CNY: 7.24,
  SEK: 10.5,
  NZD: 1.65,
  MXN: 17.1,
  SGD: 1.33,
  HKD: 7.81,
  NOK: 10.6,
  TRY: 38.5,
  BRL: 5.65,
  INR: 83.5,
  KRW: 1340.0,
  ZAR: 18.2,
  RUB: 92.0,
  PLN: 3.95,
  CZK: 23.0,
  HUF: 360.0,
  ILS: 3.65,
  THB: 34.5,
  MYR: 4.45,
  PHP: 56.0,
  IDR: 15800.0,
  VND: 25300.0,
  EGP: 48.0,
}

// ---------------------------------------------------------------------------
// Funções internas
// ---------------------------------------------------------------------------

async function fetchRatesFromApi(): Promise<CacheEntry> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(API_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })

    if (!response.ok) {
      throw new Error(`ExchangeRate API HTTP ${response.status}`)
    }

    const data = await response.json()

    if (data.result !== "success" || !data.rates) {
      throw new Error(`ExchangeRate API response inválido: ${data.result}`)
    }

    const entry: CacheEntry = {
      rates: data.rates as Record<string, number>,
      fetchedAt: Date.now(),
      lastUpdated: data.time_last_update_utc ?? new Date().toISOString(),
      nextUpdate: data.time_next_update_utc,
    }

    // Atualiza cache em memória
    memoryCache = entry

    // Persiste no Redis (se disponível)
    try {
      const redis = getRedisClient()
      if (redis) {
        await redis.set(REDIS_CACHE_KEY, JSON.stringify(entry), { ex: REDIS_TTL_SECS })
      }
    } catch (redisError) {
      console.warn("[ExchangeRateService] Falha ao persistir no Redis:", redisError)
    }

    return entry
  } finally {
    clearTimeout(timeout)
  }
}

function isCacheFresh(entry: CacheEntry): boolean {
  return Date.now() - entry.fetchedAt < CACHE_TTL_MS
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Obtém taxas de câmbio atuais com base USD.
 * Prioridade: cache fresco em memória → Redis → API → cache stale → fallback estático.
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  // 1. Cache fresco em memória (evita round-trip Redis)
  if (memoryCache && isCacheFresh(memoryCache)) {
    return {
      base: "USD",
      rates: memoryCache.rates,
      source: "CACHE",
      lastUpdated: memoryCache.lastUpdated,
      nextUpdate: memoryCache.nextUpdate,
    }
  }

  // 2. Redis (se configurado)
  try {
    const redis = getRedisClient()
    if (redis) {
      const raw = await redis.get<string>(REDIS_CACHE_KEY)
      if (raw) {
        const parsed: CacheEntry = typeof raw === "string" ? JSON.parse(raw) : raw
        if (parsed && isCacheFresh(parsed)) {
          // Popula cache em memória para requests subsequentes
          memoryCache = parsed
          return {
            base: "USD",
            rates: parsed.rates,
            source: "CACHE",
            lastUpdated: parsed.lastUpdated,
            nextUpdate: parsed.nextUpdate,
          }
        }
      }
    }
  } catch (redisError) {
    console.warn("[ExchangeRateService] Falha ao ler do Redis:", redisError)
  }

  // 3. Buscar da API
  try {
    const entry = await fetchRatesFromApi()
    return {
      base: "USD",
      rates: entry.rates,
      source: "API_REALTIME",
      lastUpdated: entry.lastUpdated,
      nextUpdate: entry.nextUpdate,
    }
  } catch (error) {
    console.warn(
      "[ExchangeRateService] Falha ao buscar taxas da API:",
      error instanceof Error ? error.message : error,
    )
  }

  // 4. Cache stale (melhor que nada)
  if (memoryCache) {
    console.warn("[ExchangeRateService] Usando cache stale de", memoryCache.lastUpdated)
    return {
      base: "USD",
      rates: memoryCache.rates,
      source: "STALE_CACHE",
      lastUpdated: memoryCache.lastUpdated,
      nextUpdate: memoryCache.nextUpdate,
    }
  }

  // 5. Fallback estático de emergência
  console.warn("[ExchangeRateService] Usando taxas estáticas de fallback (snapshot 2026-05-09)")
  return {
    base: "USD",
    rates: STATIC_FALLBACK_RATES,
    source: "STATIC_FALLBACK",
    lastUpdated: "2026-05-09T00:00:00Z",
  }
}

/**
 * Converte um valor entre duas moedas usando taxas reais.
 *
 * @param amount - Valor a converter
 * @param fromCurrency - Código ISO 4217 de origem (ex: "BRL")
 * @param toCurrency - Código ISO 4217 de destino (ex: "EUR")
 * @returns Objeto com valor convertido, taxa utilizada e fonte dos dados
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): Promise<{ result: number; rate: number; source: ExchangeRates["source"] }> {
  const from = fromCurrency.toUpperCase()
  const to = toCurrency.toUpperCase()

  if (from === to) {
    return { result: amount, rate: 1, source: "CACHE" }
  }

  const { rates, source } = await getExchangeRates()

  const fromRate = rates[from]
  const toRate = rates[to]

  if (!fromRate || !toRate) {
    throw new Error(
      `Moeda não suportada: ${!fromRate ? from : to}. ` +
        `Moedas disponíveis: ${Object.keys(rates).join(", ")}`,
    )
  }

  // Conversão via USD como moeda-base: amount / fromRate * toRate
  const rate = toRate / fromRate
  const result = Number((amount * rate).toFixed(2))

  return { result, rate, source }
}

/**
 * Converte centavos para EUR (para cálculos de low-value exemption PSD2/SCA).
 * Equivalente funcional ao antigo `convertAmountToEur` dos módulos 3DS e gateway.
 *
 * @param amountInCents - Valor em centavos
 * @param currency - Código ISO 4217
 * @returns Valor em EUR ou null se dados insuficientes
 */
export async function convertCentsToEur(
  amountInCents?: number,
  currency?: string,
): Promise<number | null> {
  if (typeof amountInCents !== "number") return null
  const amountInUnits = amountInCents / 100
  const cur = (currency ?? "EUR").toUpperCase()
  if (cur === "EUR") return amountInUnits
  try {
    const { result } = await convertCurrency(amountInUnits, cur, "EUR")
    return result
  } catch {
    return null
  }
}

/**
 * Converte centavos para BRL (para cálculos de high-value no gateway).
 * Equivalente funcional ao antigo `convertAmountToBrl` de gatewayRisk.ts.
 *
 * @param amountInCents - Valor em centavos
 * @param currency - Código ISO 4217
 * @returns Valor em BRL ou null se dados insuficientes
 */
export async function convertCentsToBrl(
  amountInCents?: number,
  currency?: string,
): Promise<number | null> {
  if (typeof amountInCents !== "number") return null
  const amountInUnits = amountInCents / 100
  const cur = (currency ?? "BRL").toUpperCase()
  if (cur === "BRL") return amountInUnits
  try {
    const { result } = await convertCurrency(amountInUnits, cur, "BRL")
    return result
  } catch {
    return null
  }
}

/**
 * Força re-fetch das taxas (ignora cache). Útil para testes e endpoints admin.
 */
export async function refreshRates(): Promise<ExchangeRates> {
  memoryCache = null
  return getExchangeRates()
}

// ---------------------------------------------------------------------------
// Acesso SÍNCRONO ao cache (para módulos que não podem ser async)
// ---------------------------------------------------------------------------

/**
 * Retorna taxas de câmbio de forma SÍNCRONA.
 * Usa cache em memória se disponível, senão fallback estático.
 *
 * IMPORTANTE: Chamar `getExchangeRates()` (async) pelo menos uma vez antes
 * (ex: no início do request handler) para popular o cache com dados reais.
 */
export function getRatesSync(): ExchangeRates {
  if (memoryCache) {
    return {
      base: "USD",
      rates: memoryCache.rates,
      source: isCacheFresh(memoryCache) ? "CACHE" : "STALE_CACHE",
      lastUpdated: memoryCache.lastUpdated,
      nextUpdate: memoryCache.nextUpdate,
    }
  }
  return {
    base: "USD",
    rates: STATIC_FALLBACK_RATES,
    source: "STATIC_FALLBACK",
    lastUpdated: "2026-05-09T00:00:00Z",
  }
}

/**
 * Converte centavos para EUR de forma SÍNCRONA (para funções sync existentes).
 * Usa cache em memória ou fallback estático.
 */
export function convertCentsToEurSync(amountInCents?: number, currency?: string): number | null {
  if (typeof amountInCents !== "number") return null
  const amountInUnits = amountInCents / 100
  const cur = (currency ?? "EUR").toUpperCase()
  if (cur === "EUR") return amountInUnits

  const { rates } = getRatesSync()
  const fromRate = rates[cur]
  const toRate = rates["EUR"]
  if (!fromRate || !toRate) return null

  return Number((amountInUnits * (toRate / fromRate)).toFixed(2))
}

/**
 * Converte centavos para BRL de forma SÍNCRONA (para funções sync existentes).
 * Usa cache em memória ou fallback estático.
 */
export function convertCentsToBrlSync(amountInCents?: number, currency?: string): number | null {
  if (typeof amountInCents !== "number") return null
  const amountInUnits = amountInCents / 100
  const cur = (currency ?? "BRL").toUpperCase()
  if (cur === "BRL") return amountInUnits

  const { rates } = getRatesSync()
  const fromRate = rates[cur]
  const toRate = rates["BRL"]
  if (!fromRate || !toRate) return null

  return Number((amountInUnits * (toRate / fromRate)).toFixed(2))
}

/**
 * Retorna informação de diagnóstico sobre o estado do cache.
 */
export function getCacheStatus(): {
  hasCachedData: boolean
  isFresh: boolean
  lastFetchedAt: string | null
  cacheAgeSecs: number | null
  redisAvailable: boolean
} {
  const redisAvailable = !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  )
  if (!memoryCache) {
    return { hasCachedData: false, isFresh: false, lastFetchedAt: null, cacheAgeSecs: null, redisAvailable }
  }
  const ageSecs = Math.round((Date.now() - memoryCache.fetchedAt) / 1000)
  return {
    hasCachedData: true,
    isFresh: isCacheFresh(memoryCache),
    lastFetchedAt: new Date(memoryCache.fetchedAt).toISOString(),
    cacheAgeSecs: ageSecs,
    redisAvailable,
  }
}
