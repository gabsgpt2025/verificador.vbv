import type { CircuitState } from "@/lib/premium-3-0/runtime/circuitBreaker"

export class NeutrinoError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly endpoint?: string,
  ) {
    super(message)
    this.name = "NeutrinoError"
  }
}

export type NeutrinoCallMeta = {
  endpoint: string
  status: number | "cache_hit" | "breaker_open"
  durationMs: number
  cached: boolean
  breakerState: CircuitState
  networkSuccess: boolean
}

export type NeutrinoResponse<T> = {
  data: T
  meta: NeutrinoCallMeta
}
