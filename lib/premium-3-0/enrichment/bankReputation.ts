import type { BinRiskFactor } from "../types"

export type BankTier = "TIER1" | "TIER2" | "TIER3"

export interface BankReputationSeedItem {
  issuerName: string
  country: string
  approvalRate: number
  fraudRate: number
  threeDsAdoption: number
  tier: BankTier
}

export const BANK_SUFFIX_PATTERN = /\b(s\.?\s*a\.?|n\.?\s*a\.?|plc|gmbh|ltd)\b\.?/gi

export const BANK_REPUTATION_SEED: BankReputationSeedItem[] = [
  { issuerName: "Banco do Brasil", country: "BR", approvalRate: 0.93, fraudRate: 0.012, threeDsAdoption: 0.91, tier: "TIER1" },
  { issuerName: "Bradesco", country: "BR", approvalRate: 0.94, fraudRate: 0.011, threeDsAdoption: 0.92, tier: "TIER1" },
  { issuerName: "Itaú", country: "BR", approvalRate: 0.94, fraudRate: 0.011, threeDsAdoption: 0.93, tier: "TIER1" },
  { issuerName: "Santander BR", country: "BR", approvalRate: 0.92, fraudRate: 0.013, threeDsAdoption: 0.89, tier: "TIER1" },
  { issuerName: "Caixa", country: "BR", approvalRate: 0.9, fraudRate: 0.016, threeDsAdoption: 0.85, tier: "TIER2" },
  { issuerName: "Nubank", country: "BR", approvalRate: 0.91, fraudRate: 0.017, threeDsAdoption: 0.87, tier: "TIER2" },
  { issuerName: "Inter", country: "BR", approvalRate: 0.9, fraudRate: 0.018, threeDsAdoption: 0.84, tier: "TIER2" },
  { issuerName: "BTG Pactual", country: "BR", approvalRate: 0.92, fraudRate: 0.014, threeDsAdoption: 0.88, tier: "TIER2" },
  { issuerName: "C6 Bank", country: "BR", approvalRate: 0.89, fraudRate: 0.019, threeDsAdoption: 0.83, tier: "TIER2" },
  { issuerName: "Mercado Pago", country: "BR", approvalRate: 0.88, fraudRate: 0.021, threeDsAdoption: 0.81, tier: "TIER3" },
  { issuerName: "Sicredi", country: "BR", approvalRate: 0.91, fraudRate: 0.015, threeDsAdoption: 0.86, tier: "TIER2" },
  { issuerName: "Sicoob", country: "BR", approvalRate: 0.9, fraudRate: 0.016, threeDsAdoption: 0.85, tier: "TIER2" },
  { issuerName: "Chase", country: "US", approvalRate: 0.95, fraudRate: 0.009, threeDsAdoption: 0.9, tier: "TIER1" },
  { issuerName: "Bank of America", country: "US", approvalRate: 0.94, fraudRate: 0.01, threeDsAdoption: 0.89, tier: "TIER1" },
  { issuerName: "Wells Fargo", country: "US", approvalRate: 0.93, fraudRate: 0.011, threeDsAdoption: 0.88, tier: "TIER1" },
  { issuerName: "Citibank", country: "US", approvalRate: 0.93, fraudRate: 0.011, threeDsAdoption: 0.89, tier: "TIER1" },
  { issuerName: "Capital One", country: "US", approvalRate: 0.92, fraudRate: 0.012, threeDsAdoption: 0.87, tier: "TIER1" },
  { issuerName: "Amex", country: "US", approvalRate: 0.96, fraudRate: 0.008, threeDsAdoption: 0.91, tier: "TIER1" },
  { issuerName: "Discover", country: "US", approvalRate: 0.91, fraudRate: 0.013, threeDsAdoption: 0.85, tier: "TIER2" },
  { issuerName: "US Bank", country: "US", approvalRate: 0.91, fraudRate: 0.013, threeDsAdoption: 0.85, tier: "TIER2" },
  { issuerName: "PNC Bank", country: "US", approvalRate: 0.9, fraudRate: 0.014, threeDsAdoption: 0.84, tier: "TIER2" },
  { issuerName: "TD Bank", country: "US", approvalRate: 0.9, fraudRate: 0.014, threeDsAdoption: 0.84, tier: "TIER2" },
  { issuerName: "Barclays", country: "GB", approvalRate: 0.94, fraudRate: 0.01, threeDsAdoption: 0.92, tier: "TIER1" },
  { issuerName: "HSBC", country: "GB", approvalRate: 0.93, fraudRate: 0.011, threeDsAdoption: 0.91, tier: "TIER1" },
  { issuerName: "Lloyds", country: "GB", approvalRate: 0.92, fraudRate: 0.012, threeDsAdoption: 0.9, tier: "TIER1" },
  { issuerName: "NatWest", country: "GB", approvalRate: 0.91, fraudRate: 0.013, threeDsAdoption: 0.88, tier: "TIER2" },
  { issuerName: "Deutsche Bank", country: "DE", approvalRate: 0.93, fraudRate: 0.011, threeDsAdoption: 0.9, tier: "TIER1" },
  { issuerName: "Commerzbank", country: "DE", approvalRate: 0.91, fraudRate: 0.012, threeDsAdoption: 0.88, tier: "TIER2" },
  { issuerName: "BNP Paribas", country: "FR", approvalRate: 0.93, fraudRate: 0.011, threeDsAdoption: 0.91, tier: "TIER1" },
  { issuerName: "Société Générale", country: "FR", approvalRate: 0.92, fraudRate: 0.012, threeDsAdoption: 0.89, tier: "TIER2" },
  { issuerName: "ING", country: "NL", approvalRate: 0.93, fraudRate: 0.011, threeDsAdoption: 0.9, tier: "TIER1" },
  { issuerName: "Santander ES", country: "ES", approvalRate: 0.92, fraudRate: 0.012, threeDsAdoption: 0.9, tier: "TIER1" },
  { issuerName: "BBVA", country: "ES", approvalRate: 0.92, fraudRate: 0.012, threeDsAdoption: 0.9, tier: "TIER1" },
  { issuerName: "CaixaBank", country: "ES", approvalRate: 0.91, fraudRate: 0.013, threeDsAdoption: 0.88, tier: "TIER2" },
  { issuerName: "UniCredit", country: "IT", approvalRate: 0.91, fraudRate: 0.013, threeDsAdoption: 0.88, tier: "TIER2" },
  { issuerName: "Intesa Sanpaolo", country: "IT", approvalRate: 0.91, fraudRate: 0.013, threeDsAdoption: 0.88, tier: "TIER2" },
  { issuerName: "Revolut", country: "LT", approvalRate: 0.9, fraudRate: 0.015, threeDsAdoption: 0.87, tier: "TIER2" },
  { issuerName: "N26", country: "DE", approvalRate: 0.89, fraudRate: 0.016, threeDsAdoption: 0.86, tier: "TIER2" },
  { issuerName: "Wise", country: "GB", approvalRate: 0.9, fraudRate: 0.015, threeDsAdoption: 0.87, tier: "TIER2" },
  { issuerName: "Monzo", country: "GB", approvalRate: 0.89, fraudRate: 0.016, threeDsAdoption: 0.85, tier: "TIER2" },
]

const BANK_LOOKUP = new Map<string, BankReputationSeedItem>(
  BANK_REPUTATION_SEED.map((item) => [`${normalizeIssuerName(item.issuerName)}:${item.country}`, item]),
)

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

export function normalizeIssuerName(issuerName?: string | null) {
  return (issuerName ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(BANK_SUFFIX_PATTERN, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function lookupBankReputation(issuerName?: string | null, countryCode?: string | null) {
  const normalizedIssuer = normalizeIssuerName(issuerName)
  const normalizedCountry = (countryCode ?? "").trim().toUpperCase().slice(0, 2)
  const byCountry = normalizedCountry ? BANK_LOOKUP.get(`${normalizedIssuer}:${normalizedCountry}`) : undefined
  const fallback = normalizedIssuer
    ? BANK_REPUTATION_SEED.find((item) => normalizeIssuerName(item.issuerName) === normalizedIssuer)
    : undefined
  const found = byCountry ?? fallback

  if (!found) {
    return {
      tier: "TIER2" as const,
      approvalRate: 0.86,
      fraudRate: 0.018,
      threeDsAdoption: 0.72,
      score: 30,
      found: false,
    }
  }

  const tierImpact = found.tier === "TIER1" ? -12 : found.tier === "TIER2" ? 0 : 12
  const approvalImpact = Math.round((0.9 - found.approvalRate) * 120)
  const fraudImpact = Math.round(found.fraudRate * 1200)
  const threeDsImpact = Math.round((0.85 - found.threeDsAdoption) * 80)
  const score = clamp(30 + tierImpact + approvalImpact + fraudImpact + threeDsImpact, 0, 100)

  return {
    tier: found.tier,
    approvalRate: found.approvalRate,
    fraudRate: found.fraudRate,
    threeDsAdoption: found.threeDsAdoption,
    score,
    found: true,
  }
}

export function buildBankReputationFactors(issuerName?: string | null, countryCode?: string | null): BinRiskFactor[] {
  const reputation = lookupBankReputation(issuerName, countryCode)

  if (!reputation.found) {
    return [
      {
        label: "Emissor fora da base de reputação",
        impact: 0,
        reason: "Sem benchmark do emissor, o motor comportamental usa baseline neutro.",
      },
    ]
  }

  return [
    {
      label: `Tier de emissor: ${reputation.tier}`,
      impact: reputation.tier === "TIER1" ? -12 : reputation.tier === "TIER3" ? 12 : 0,
      reason: `Histórico estático de aprovação/fraude para ${issuerName ?? "emissor informado"}.`,
    },
    {
      label: "Taxas históricas do emissor",
      impact: reputation.score - 30,
      reason: `Aprovação ${(reputation.approvalRate * 100).toFixed(1)}%, fraude ${(reputation.fraudRate * 100).toFixed(2)}%, 3DS ${(reputation.threeDsAdoption * 100).toFixed(1)}%.`,
    },
  ]
}
