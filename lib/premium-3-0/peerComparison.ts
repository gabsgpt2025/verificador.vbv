import { getCountryRiskTier } from "./enrichment/geoEnrichment"
import type { BinApiData, PeerComparison } from "./types"

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (field: string, value: string) => {
        eq: (field2: string, value2: string) => {
          gte: (field3: string, value3: string) => PromiseLike<{ data: Array<{ risk_score: number }> | null; error: { message: string } | null }>
        }
      }
    }
  }
}

function clampPercentile(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function computePercentile(values: number[], score: number) {
  if (values.length === 0) return 50
  const sorted = [...values].sort((a, b) => a - b)
  const lessOrEqual = sorted.filter((value) => value <= score).length
  return clampPercentile((lessOrEqual / sorted.length) * 100)
}

function fallbackPeerSample(countryCode?: string | null) {
  const tier = getCountryRiskTier(countryCode)
  if (tier === "critical") return [70, 75, 80, 85, 90, 95]
  if (tier === "tier3") return [45, 50, 55, 60, 65, 70]
  if (tier === "tier2") return [30, 35, 40, 45, 50, 55]
  return [15, 20, 25, 30, 35, 40]
}

export async function comparePeers(
  binData: BinApiData,
  riskScore: number,
  supabase?: SupabaseLike,
): Promise<PeerComparison> {
  const country = (binData.countryCode ?? "XX").toUpperCase()
  const brand = (binData.brand ?? "UNKNOWN").toUpperCase()
  const type = (binData.type ?? "UNKNOWN").toUpperCase()
  const peerGroup = `${brand}-${country}-${type}`

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  let peerScores: number[] = []

  if (supabase) {
    try {
      const queryBuilder = supabase
        .from("bin_analyses")
        .select("risk_score")
        .eq("country", country)
        .eq("brand", brand)
        .gte("created_at", thirtyDaysAgo)
      const { data, error } = await queryBuilder

      if (!error && data) {
        peerScores = data.map((entry) => Number(entry.risk_score)).filter((score) => Number.isFinite(score))
      }
    } catch {
      peerScores = []
    }
  }

  if (peerScores.length < 5) {
    peerScores = fallbackPeerSample(country)
  }

  const percentile = computePercentile(peerScores, riskScore)
  const peerCount = peerScores.length
  const betterThan = percentile

  return {
    percentile,
    peerCount,
    betterThan,
    peerGroup,
  }
}
