import bankReputationData from "../data/bankReputation.json"
import type { BinRiskFactor } from "../types"

export interface BankRep {
  approvalRate: number
  fraudRate: number
  threeDsAdoption: number
  tier: "TIER1" | "TIER2" | "TIER3"
}

const BANK_REPUTATION_LOOKUP = new Map<string, BankRep>(
  Object.entries(bankReputationData).map(([issuerName, reputation]) => [normalizeIssuerName(issuerName), reputation as BankRep]),
)

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

export function normalizeIssuerName(issuerName?: string | null) {
  return (issuerName ?? "").trim().replace(/\s+/g, " ").toUpperCase()
}

export function getBankReputation(issuerName: string | null): BankRep | null {
  const normalizedIssuer = normalizeIssuerName(issuerName)
  if (!normalizedIssuer) {
    return null
  }

  return BANK_REPUTATION_LOOKUP.get(normalizedIssuer) ?? null
}

export function calculateBankRisk(issuer: string | null) {
  const factors: BinRiskFactor[] = []
  const reputation = getBankReputation(issuer)

  if (!issuer || !reputation) {
    factors.push({
      label: "Emissor fora da base de reputação",
      impact: 0,
      reason: "Sem benchmark do emissor, o motor usa score neutro 30 para reputação bancária.",
    })

    return { score: 30, factors }
  }

  const tierImpact = reputation.tier === "TIER1" ? -10 : reputation.tier === "TIER2" ? 0 : 12
  const fraudImpact = Math.round(reputation.fraudRate * 1500)
  const approvalImpact = Math.round((0.9 - reputation.approvalRate) * 80)
  const adoptionImpact = Math.round((0.9 - reputation.threeDsAdoption) * 50)

  const score = clamp(20 + tierImpact + fraudImpact + approvalImpact + adoptionImpact, 0, 100)

  factors.push({
    label: `Benchmark do emissor ${reputation.tier}`,
    impact: tierImpact,
    reason: `O emissor ${normalizeIssuerName(issuer)} foi classificado como ${reputation.tier} na base estática de reputação.`,
  })
  factors.push({
    label: "Taxa histórica de fraude do emissor",
    impact: fraudImpact,
    reason: `Fraud rate aproximada de ${(reputation.fraudRate * 100).toFixed(2)}% na base seed.`,
  })
  factors.push({
    label: "Taxa histórica de aprovação do emissor",
    impact: approvalImpact,
    reason: `Approval rate aproximada de ${(reputation.approvalRate * 100).toFixed(1)}% considerada no benchmark.`,
  })
  factors.push({
    label: "Adoção 3DS do emissor",
    impact: adoptionImpact,
    reason: `Adoção aproximada de ${(reputation.threeDsAdoption * 100).toFixed(1)}% para 3DS/fingerprint do emissor.`,
  })

  return { score, factors }
}
