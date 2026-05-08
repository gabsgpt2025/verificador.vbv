import { NextResponse } from "next/server"
import { getCacheStats, getCacheType } from "@/lib/premium-3-0/runtime/cache"
import { listBreakers } from "@/lib/premium-3-0/runtime/circuitBreaker"
import { getMetrics } from "@/lib/premium-3-0/runtime/metrics"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const adminKey = process.env.ADMIN_METRICS_KEY
  if (!adminKey) {
    return NextResponse.json({ error: "metrics endpoint disabled" }, { status: 503 })
  }

  if (request.headers.get("x-admin-key") !== adminKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const cache = getCacheStats()

  return NextResponse.json({
    cache: {
      ...cache,
      type: getCacheType(),
    },
    breakers: listBreakers().map((breaker) => ({
      name: breaker.options.name,
      state: breaker.state,
      successes: breaker.metrics.successes,
      failures: breaker.metrics.failures,
      rejected: breaker.metrics.rejected,
    })),
    providers: getMetrics(),
  })
}
