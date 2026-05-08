import type { z } from "zod"
import { getNeutrinoCredentials } from "@/lib/env"
import { CircuitOpenError, getBreaker } from "@/lib/premium-3-0/runtime/circuitBreaker"
import { resilientFetch } from "@/lib/premium-3-0/runtime/resilientFetch"
import type { NeutrinoResponse } from "./types"
import { NeutrinoError } from "./types"

const NEUTRINO_BASE_URL = "https://neutrinoapi.net"
const NEUTRINO_TIMEOUT_MS = 4000
const NEUTRINO_RETRY_BASE_MS = 300

export async function executeNeutrinoRequest<T>(config: {
  endpoint: string
  operation: string
  body: Record<string, string>
  cacheKey: string
  cacheTtlSeconds: number
  schema: z.ZodType<T>
}): Promise<NeutrinoResponse<T>> {
  const { apiKey, userId } = getNeutrinoCredentials()
  const startedAt = Date.now()
  const breakerName = `neutrino:${config.operation}`
  const breaker = getBreaker(breakerName)
  let responseStatus: number | "cache_hit" | "breaker_open" = 200

  try {
    const { data, cached, latencyMs } = await resilientFetch(
      async () => {
        const response = await fetch(`${NEUTRINO_BASE_URL}/${config.endpoint}`, {
          method: "POST",
          headers: {
            "User-ID": userId,
            "API-Key": apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(config.body).toString(),
          signal: AbortSignal.timeout(NEUTRINO_TIMEOUT_MS),
        })

        responseStatus = response.status

        if (!response.ok) {
          const errorText = await response.text()
          throw new NeutrinoError(`Neutrino API error: ${response.status} - ${errorText}`, response.status, config.endpoint)
        }

        return response.json()
      },
      {
        providerName: "neutrino",
        operation: config.operation,
        cacheKey: config.cacheKey,
        cacheTtlSeconds: config.cacheTtlSeconds,
        breakerOptions: {
          name: breakerName,
          failureThreshold: 5,
          timeoutMs: NEUTRINO_TIMEOUT_MS,
        },
        retryOptions: {
          maxAttempts: 2,
          baseDelayMs: NEUTRINO_RETRY_BASE_MS,
          jitter: false,
        },
        parse: (raw) => config.schema.parse(raw),
      },
    )

    const meta = {
      endpoint: config.endpoint,
      status: cached ? "cache_hit" : responseStatus,
      durationMs: latencyMs,
      cached,
      breakerState: breaker.state,
      networkSuccess: !cached,
    } as const

    console.info("[neutrino] request", meta)

    return {
      data,
      meta,
    }
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      responseStatus = "breaker_open"
    }

    const durationMs = Date.now() - startedAt
    console.warn("[neutrino] request_failed", {
      endpoint: config.endpoint,
      status: responseStatus,
      durationMs,
      cached: false,
      breakerState: breaker.state,
      message: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}
