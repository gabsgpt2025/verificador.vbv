// VeriFiBIN 2.0 — Issuer Intelligence Database
// Proprietary knowledge base of known issuers, BIN prefixes and their 3DS/bypass behavior.
// IMPORTANT: All bypass probabilities are probabilistic inferences based on observed behavior.
// "Bypass" in this context refers to the 3DS2 Frictionless Flow or SCA Exemptions being applied,
// NOT to circumventing security illegally.

import issuerData from "./data/issuer-data.json"

export type IssuerCategory =
  | "BANCO_TRADICIONAL"
  | "BANCO_DIGITAL"
  | "FINTECH_PREPAGO"
  | "FINTECH_VIRTUAL"
  | "CORPORATIVO"
  | "WHITE_LABEL"
  | "GOVERNO_SOCIAL"
  | "CRIPTO"

export type BypassMechanism =
  | "FRICTIONLESS_3DS2"       // 3DS2 active, but frictionless flow applied by issuer ACS
  | "SCA_EXEMPTION_B2B"       // PSD2 Secure Corporate Payment Exemption
  | "SCA_EXEMPTION_LOW_VALUE" // PSD2 Low-Value Transaction Exemption (<€30)
  | "SCA_EXEMPTION_TRA"       // Transaction Risk Analysis Exemption
  | "3DS_NOMINAL"             // 3DS enrolled but not effectively implemented (enrolled=Y, but no real ACS)
  | "GATEWAY_FALLBACK"        // Gateway does not implement full 3DS fallback
  | "NO_3DS"                  // No 3DS implementation at all
  | "UNKNOWN"

export type FrictionlessLikelihood = "MUITO_ALTA" | "ALTA" | "MEDIA" | "BAIXA" | "MUITO_BAIXA"

export interface IssuerProfile {
  name: string
  countryCode: string
  category: IssuerCategory
  binPrefixes: string[]
  threeDSActive: boolean
  frictionlessLikelihood: FrictionlessLikelihood
  bypassMechanism: BypassMechanism
  cvvDynamic: boolean
  multipleAttemptsAllowed: boolean
  silentDeclineRisk: boolean
  newCardDelay3DS: boolean // Some issuers activate 3DS only 24-72h after card issuance
  whiteLabel: boolean
  parentIssuer?: string
  technicalNotes: string
  alerts: string[]
}

// Load issuer data from external JSON file to reduce bundle size and avoid webpack serialization warnings
export const ISSUER_INTELLIGENCE: Record<string, IssuerProfile> = issuerData as Record<string, IssuerProfile>

// ─── Lookup Functions ──────────────────────────────────────────────────────

export function findIssuerByBinPrefix(binPrefix: string): IssuerProfile | null {
  const prefix6 = binPrefix.substring(0, 6)
  const prefix4 = binPrefix.substring(0, 4)

  for (const issuer of Object.values(ISSUER_INTELLIGENCE)) {
    for (const prefix of issuer.binPrefixes) {
      const normalizedPrefix = prefix.replace(/\s/g, "")
      if (prefix6.startsWith(normalizedPrefix) || prefix4.startsWith(normalizedPrefix)) {
        return issuer
      }
    }
  }
  return null
}

export function findIssuerByName(issuerName: string): IssuerProfile | null {
  if (!issuerName) return null
  const upper = issuerName.toUpperCase()

  const nameMap: Record<string, string> = {
    "NUBANK": "NUBANK",
    "NU PAGAMENTOS": "NUBANK",
    "BANCO INTER": "BANCO_INTER",
    "INTER": "BANCO_INTER",
    "C6 BANK": "C6_BANK",
    "C6": "C6_BANK",
    "PAGBANK": "PAGBANK",
    "PAGSEGURO": "PAGBANK",
    "CAIXA": "CAIXA",
    "CAIXA ECONOMICA": "CAIXA",
    "ITAU": "ITAU",
    "BRADESCO": "BRADESCO",
    "SANTANDER": "SANTANDER_PJ",
    "REVOLUT": "REVOLUT",
    "WISE": "WISE",
    "ADVCASH": "ADVCASH",
    "CRYPTO.COM": "CRYPTO_COM",
    "PAYONEER": "PAYONEER",
    "GREEN DOT": "GREEN_DOT",
    "NETSPEND": "NETSPEND",
    "TINKOFF": "TINKOFF",
    "N26": "N26",
    "CHASE": "CHASE",
    "JPMORGAN": "CHASE",
    "BANK OF AMERICA": "BANK_OF_AMERICA",
    "WELLS FARGO": "WELLS_FARGO",
    "BARCLAYS": "BARCLAYS",
    "MONOBANK": "MONOBANK",
    "QONTO": "QONTO",
  }

  for (const [key, issuerKey] of Object.entries(nameMap)) {
    if (upper.includes(key)) {
      return ISSUER_INTELLIGENCE[issuerKey] ?? null
    }
  }
  return null
}

export function getIssuerAlerts(issuer: IssuerProfile): string[] {
  return issuer.alerts
}

export function getBypassMechanismDescription(mechanism: BypassMechanism): string {
  const descriptions: Record<BypassMechanism, string> = {
    FRICTIONLESS_3DS2: "3DS 2.0 ativo com fluxo frictionless — autenticação silenciosa pelo ACS do emissor",
    SCA_EXEMPTION_B2B: "Isenção SCA para pagamentos corporativos (PSD2 Secure Corporate Payment Exemption)",
    SCA_EXEMPTION_LOW_VALUE: "Isenção SCA para transações de baixo valor (< €30 / R$150)",
    SCA_EXEMPTION_TRA: "Isenção por Análise de Risco de Transação (TRA) — emissor/adquirente com baixa taxa de fraude",
    "3DS_NOMINAL": "3DS registrado nominalmente (enrolled=Y), mas sem ACS real implementado pelo emissor",
    GATEWAY_FALLBACK: "Gateway não implementa fallback completo de 3DS — transação aprovada sem autenticação",
    NO_3DS: "Sem implementação de 3DS pelo emissor",
    UNKNOWN: "Mecanismo de bypass não determinado",
  }
  return descriptions[mechanism]
}
