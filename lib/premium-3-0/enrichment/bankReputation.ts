import type { BankReputation, BinRiskFactor } from "../types"

export function normalizeIssuerName(issuerName?: string | null) {
  return (issuerName ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export const BANK_REPUTATION: Record<string, BankReputation> = {
  BRADESCO: { approvalRate: 92, fraudRate: 3, threeDsAdoption: 95, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  ITAU: { approvalRate: 91, fraudRate: 4, threeDsAdoption: 94, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  "BANCO DO BRASIL": { approvalRate: 90, fraudRate: 4, threeDsAdoption: 93, threeDsMaturity: "HIGH", defaultMethod: "OTP_SMS" },
  NUBANK: { approvalRate: 95, fraudRate: 2, threeDsAdoption: 96, threeDsMaturity: "VERY_HIGH", defaultMethod: "APP_PUSH" },
  "SANTANDER BRASIL": { approvalRate: 90, fraudRate: 4, threeDsAdoption: 93, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  CAIXA: { approvalRate: 88, fraudRate: 5, threeDsAdoption: 89, threeDsMaturity: "MEDIUM", defaultMethod: "OTP_SMS" },
  INTER: { approvalRate: 93, fraudRate: 3, threeDsAdoption: 94, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  BTG: { approvalRate: 92, fraudRate: 3, threeDsAdoption: 93, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  "C6 BANK": { approvalRate: 90, fraudRate: 4, threeDsAdoption: 92, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  PICPAY: { approvalRate: 89, fraudRate: 5, threeDsAdoption: 90, threeDsMaturity: "MEDIUM", defaultMethod: "APP_PUSH" },
  SICREDI: { approvalRate: 89, fraudRate: 4, threeDsAdoption: 90, threeDsMaturity: "MEDIUM", defaultMethod: "OTP_SMS" },
  SICOOB: { approvalRate: 88, fraudRate: 4, threeDsAdoption: 89, threeDsMaturity: "MEDIUM", defaultMethod: "OTP_SMS" },
  SAFRA: { approvalRate: 90, fraudRate: 4, threeDsAdoption: 91, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  PAN: { approvalRate: 86, fraudRate: 6, threeDsAdoption: 84, threeDsMaturity: "MEDIUM", defaultMethod: "OTP_SMS" },
  NEON: { approvalRate: 87, fraudRate: 5, threeDsAdoption: 86, threeDsMaturity: "MEDIUM", defaultMethod: "APP_PUSH" },
  DIGIO: { approvalRate: 88, fraudRate: 5, threeDsAdoption: 88, threeDsMaturity: "MEDIUM", defaultMethod: "OTP_SMS" },
  ORIGINAL: { approvalRate: 87, fraudRate: 5, threeDsAdoption: 86, threeDsMaturity: "MEDIUM", defaultMethod: "OTP_SMS" },
  MERCADO: { approvalRate: 89, fraudRate: 4, threeDsAdoption: 91, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  WILL: { approvalRate: 86, fraudRate: 6, threeDsAdoption: 84, threeDsMaturity: "MEDIUM", defaultMethod: "OTP_SMS" },
  XP: { approvalRate: 91, fraudRate: 3, threeDsAdoption: 92, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },

  CHASE: { approvalRate: 94, fraudRate: 2, threeDsAdoption: 95, threeDsMaturity: "VERY_HIGH", defaultMethod: "APP_PUSH" },
  "BANK OF AMERICA": { approvalRate: 93, fraudRate: 2, threeDsAdoption: 94, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  "WELLS FARGO": { approvalRate: 91, fraudRate: 3, threeDsAdoption: 92, threeDsMaturity: "HIGH", defaultMethod: "OTP_SMS" },
  CITI: { approvalRate: 92, fraudRate: 3, threeDsAdoption: 93, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  "CAPITAL ONE": { approvalRate: 93, fraudRate: 2, threeDsAdoption: 95, threeDsMaturity: "VERY_HIGH", defaultMethod: "APP_PUSH" },
  AMEX: { approvalRate: 95, fraudRate: 2, threeDsAdoption: 97, threeDsMaturity: "VERY_HIGH", defaultMethod: "APP_PUSH" },
  DISCOVER: { approvalRate: 91, fraudRate: 3, threeDsAdoption: 92, threeDsMaturity: "HIGH", defaultMethod: "OTP_SMS" },
  "US BANK": { approvalRate: 90, fraudRate: 3, threeDsAdoption: 91, threeDsMaturity: "HIGH", defaultMethod: "OTP_SMS" },
  PNC: { approvalRate: 90, fraudRate: 3, threeDsAdoption: 90, threeDsMaturity: "HIGH", defaultMethod: "OTP_SMS" },
  TD: { approvalRate: 89, fraudRate: 3, threeDsAdoption: 90, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  RBC: { approvalRate: 91, fraudRate: 2, threeDsAdoption: 93, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  CIBC: { approvalRate: 89, fraudRate: 3, threeDsAdoption: 91, threeDsMaturity: "HIGH", defaultMethod: "OTP_SMS" },
  SCOTIABANK: { approvalRate: 90, fraudRate: 3, threeDsAdoption: 91, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  BMO: { approvalRate: 88, fraudRate: 3, threeDsAdoption: 89, threeDsMaturity: "MEDIUM", defaultMethod: "OTP_SMS" },

  BARCLAYS: { approvalRate: 91, fraudRate: 3, threeDsAdoption: 94, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  HSBC: { approvalRate: 90, fraudRate: 3, threeDsAdoption: 93, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  LLOYDS: { approvalRate: 89, fraudRate: 3, threeDsAdoption: 92, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  NATWEST: { approvalRate: 88, fraudRate: 4, threeDsAdoption: 91, threeDsMaturity: "HIGH", defaultMethod: "OTP_SMS" },
  MONZO: { approvalRate: 92, fraudRate: 2, threeDsAdoption: 95, threeDsMaturity: "VERY_HIGH", defaultMethod: "APP_PUSH" },
  STARLING: { approvalRate: 92, fraudRate: 2, threeDsAdoption: 95, threeDsMaturity: "VERY_HIGH", defaultMethod: "APP_PUSH" },
  "DEUTSCHE BANK": { approvalRate: 89, fraudRate: 3, threeDsAdoption: 91, threeDsMaturity: "HIGH", defaultMethod: "OTP_SMS" },
  COMMERZBANK: { approvalRate: 88, fraudRate: 3, threeDsAdoption: 90, threeDsMaturity: "HIGH", defaultMethod: "OTP_SMS" },
  "BNP PARIBAS": { approvalRate: 89, fraudRate: 3, threeDsAdoption: 92, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  SOCIETE: { approvalRate: 88, fraudRate: 3, threeDsAdoption: 91, threeDsMaturity: "HIGH", defaultMethod: "OTP_SMS" },
  ING: { approvalRate: 90, fraudRate: 2, threeDsAdoption: 93, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  ABN: { approvalRate: 89, fraudRate: 2, threeDsAdoption: 92, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  SANTANDER: { approvalRate: 89, fraudRate: 3, threeDsAdoption: 91, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  BBVA: { approvalRate: 89, fraudRate: 3, threeDsAdoption: 91, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  UNICREDIT: { approvalRate: 87, fraudRate: 4, threeDsAdoption: 89, threeDsMaturity: "MEDIUM", defaultMethod: "OTP_SMS" },
  INTESA: { approvalRate: 88, fraudRate: 4, threeDsAdoption: 90, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  REVOLUT: { approvalRate: 94, fraudRate: 2, threeDsAdoption: 97, threeDsMaturity: "VERY_HIGH", defaultMethod: "APP_PUSH" },
  WISE: { approvalRate: 93, fraudRate: 2, threeDsAdoption: 96, threeDsMaturity: "VERY_HIGH", defaultMethod: "APP_PUSH" },
  N26: { approvalRate: 92, fraudRate: 2, threeDsAdoption: 96, threeDsMaturity: "VERY_HIGH", defaultMethod: "APP_PUSH" },
  KLARNA: { approvalRate: 90, fraudRate: 3, threeDsAdoption: 94, threeDsMaturity: "HIGH", defaultMethod: "APP_PUSH" },
  STRIPE: { approvalRate: 91, fraudRate: 2, threeDsAdoption: 95, threeDsMaturity: "VERY_HIGH", defaultMethod: "APP_PUSH" },
}

const BANK_ENTRIES = Object.entries(BANK_REPUTATION).map(([issuerName, reputation]) => ({
  normalizedName: normalizeIssuerName(issuerName),
  reputation,
}))

const BASE_APPROVAL_TARGET = 95
const APPROVAL_WEIGHT = 0.8
const FRAUD_WEIGHT = 2
const BASE_3DS_TARGET = 90
const ADOPTION_WEIGHT = 0.5

export function lookupBank(issuerName: string): BankReputation | null {
  const normalized = normalizeIssuerName(issuerName)
  if (!normalized) return null

  const exactMatch = BANK_ENTRIES.find((entry) => entry.normalizedName === normalized)
  if (exactMatch) return exactMatch.reputation

  const fuzzyMatch = BANK_ENTRIES.find(
    (entry) =>
      normalized.includes(entry.normalizedName) ||
      entry.normalizedName.includes(normalized) ||
      entry.normalizedName.split(" ").some((token) => token.length > 2 && normalized.includes(token)),
  )

  return fuzzyMatch?.reputation ?? null
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function calculateBankRisk(issuerName: string | null) {
  const factors: BinRiskFactor[] = []
  const bank = issuerName ? lookupBank(issuerName) : null

  if (!bank) {
    factors.push({
      label: "Emissor sem benchmark",
      impact: 0,
      reason: "Banco não encontrado na base estática, aplicado ajuste neutro.",
    })

    return { score: 30, factors }
  }

  const approvalAdjustment = Math.round((BASE_APPROVAL_TARGET - bank.approvalRate) * APPROVAL_WEIGHT)
  const fraudAdjustment = Math.round(bank.fraudRate * FRAUD_WEIGHT)
  const adoptionAdjustment = Math.round((BASE_3DS_TARGET - bank.threeDsAdoption) * ADOPTION_WEIGHT)

  const score = clamp(20 + approvalAdjustment + fraudAdjustment + adoptionAdjustment)

  factors.push({
    label: "Taxa de aprovação do banco",
    impact: approvalAdjustment,
    reason: `Approval rate seed de ${bank.approvalRate}% aplicada no ensemble de BIN.`,
  })
  factors.push({
    label: "Taxa histórica de fraude",
    impact: fraudAdjustment,
    reason: `Fraud rate seed de ${bank.fraudRate}% aplicada no ensemble de BIN.`,
  })
  factors.push({
    label: "Adoção 3DS do banco",
    impact: adoptionAdjustment,
    reason: `Adoção seed de ${bank.threeDsAdoption}% impacta resiliência de autenticação.`,
  })

  return { score, factors }
}
