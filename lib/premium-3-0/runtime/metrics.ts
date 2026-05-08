import { CircuitOpenError } from "./circuitBreaker"

export interface ProviderMetrics {
  provider: string
  operation: string
  totalCalls: number
  successCount: number
  errorCount: number
  cacheHits: number
  cacheMisses: number
  circuitOpens: number
  latency: { p50: number; p95: number; p99: number; avg: number; samples: number }
  lastError?: { message: string; timestamp: number }
}

type MutableProviderMetrics = Omit<ProviderMetrics, "latency"> & {
  latencyValues: number[]
  latencyCursor: number
}

const LATENCY_BUFFER_SIZE = 1_000
const metricsStore = new Map<string, MutableProviderMetrics>()

function getMetricsKey(provider: string, operation: string): string {
  return `${provider}:${operation}`
}

function getOrCreateMetrics(provider: string, operation: string): MutableProviderMetrics {
  const key = getMetricsKey(provider, operation)
  const existing = metricsStore.get(key)
  if (existing) {
    return existing
  }

  const created: MutableProviderMetrics = {
    provider,
    operation,
    totalCalls: 0,
    successCount: 0,
    errorCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    circuitOpens: 0,
    latencyValues: [],
    latencyCursor: 0,
  }
  metricsStore.set(key, created)
  return created
}

function addLatencySample(metrics: MutableProviderMetrics, latencyMs: number) {
  if (metrics.latencyValues.length < LATENCY_BUFFER_SIZE) {
    metrics.latencyValues.push(latencyMs)
    return
  }

  metrics.latencyValues[metrics.latencyCursor] = latencyMs
  metrics.latencyCursor = (metrics.latencyCursor + 1) % LATENCY_BUFFER_SIZE
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) {
    return 0
  }

  const index = Math.min(values.length - 1, Math.ceil((percentile / 100) * values.length) - 1)
  return values[index]
}

function buildLatencySummary(metrics: MutableProviderMetrics) {
  const sortedValues = [...metrics.latencyValues].sort((left, right) => left - right)
  const total = sortedValues.reduce((sum, value) => sum + value, 0)

  return {
    p50: calculatePercentile(sortedValues, 50),
    p95: calculatePercentile(sortedValues, 95),
    p99: calculatePercentile(sortedValues, 99),
    avg: sortedValues.length === 0 ? 0 : total / sortedValues.length,
    samples: sortedValues.length,
  }
}

export function recordCall(
  provider: string,
  operation: string,
  result: {
    success: boolean
    cached: boolean
    latencyMs: number
    error?: Error
  },
): void {
  const metrics = getOrCreateMetrics(provider, operation)
  metrics.totalCalls += 1

  if (result.success) {
    metrics.successCount += 1
  } else {
    metrics.errorCount += 1
  }

  if (result.cached) {
    metrics.cacheHits += 1
  } else {
    metrics.cacheMisses += 1
  }

  if (result.error instanceof CircuitOpenError) {
    metrics.circuitOpens += 1
  }

  if (result.error) {
    metrics.lastError = {
      message: result.error.message,
      timestamp: Date.now(),
    }
  }

  addLatencySample(metrics, result.latencyMs)
}

export function getMetrics(): ProviderMetrics[] {
  return Array.from(metricsStore.values()).map((metrics) => ({
    provider: metrics.provider,
    operation: metrics.operation,
    totalCalls: metrics.totalCalls,
    successCount: metrics.successCount,
    errorCount: metrics.errorCount,
    cacheHits: metrics.cacheHits,
    cacheMisses: metrics.cacheMisses,
    circuitOpens: metrics.circuitOpens,
    lastError: metrics.lastError,
    latency: buildLatencySummary(metrics),
  }))
}

export function getMetricsFor(provider: string, operation: string): ProviderMetrics | null {
  return getMetrics().find((metrics) => metrics.provider === provider && metrics.operation === operation) ?? null
}

export function resetMetrics(): void {
  metricsStore.clear()
}
