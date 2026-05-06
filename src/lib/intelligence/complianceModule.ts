// VeriFiBIN 2.0 — Compliance Module
// Maps country/region to regulatory framework and 3DS mandate level

import type { ComplianceData, ThreeDSMandateLevel, ConfidenceLevel } from "./types"
import { getCountryMaturity } from "./countryMaturity"

export function buildComplianceData(countryCode: string | null): ComplianceData {
  if (!countryCode) {
    return {
      regulatoryRegion: "Desconhecido",
      threeDSMandateLevel: "DESCONHECIDO",
      regulationNote: "País não identificado. Não é possível determinar o framework regulatório aplicável.",
      liabilityShiftExpected: false,
      complianceRisk: "ALTA",
    }
  }

  const config = getCountryMaturity(countryCode)

  const mandateLevel: ThreeDSMandateLevel = config.mandateLevel

  let liabilityShiftExpected = false
  let complianceRisk: ConfidenceLevel = "BAIXA"
  let regulatoryRegion = config.name
  let regulationNote = ""

  // European Union / EEA
  const euCountries = [
    "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
    "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT",
    "NL", "PL", "PT", "RO", "SE", "SI", "SK",
  ]

  if (euCountries.includes(countryCode)) {
    regulatoryRegion = "União Europeia"
    liabilityShiftExpected = true
    complianceRisk = "BAIXA"
    regulationNote =
      "País membro da UE. PSD2/SCA em vigor desde setembro de 2021. " +
      "Autenticação forte (SCA) é obrigatória para a maioria das transações eletrônicas. " +
      "Liability shift ocorre quando 3DS é utilizado."
  } else if (countryCode === "GB") {
    regulatoryRegion = "Reino Unido"
    liabilityShiftExpected = true
    complianceRisk = "BAIXA"
    regulationNote =
      "UK SCA obrigatório desde março de 2022 (FCA). " +
      "Mesmas regras da PSD2 europeia mantidas pós-Brexit."
  } else if (countryCode === "NO" || countryCode === "IS" || countryCode === "LI") {
    regulatoryRegion = "EEA (não-EU)"
    liabilityShiftExpected = true
    complianceRisk = "BAIXA"
    regulationNote = "País do EEA. PSD2/SCA aplicável."
  } else if (countryCode === "IN") {
    regulatoryRegion = "Índia"
    liabilityShiftExpected = true
    complianceRisk = "BAIXA"
    regulationNote =
      "Reserve Bank of India (RBI) exige autenticação adicional (AFA) obrigatória para todas as transações de e-commerce. " +
      "Regulamentação mais rigorosa do mundo."
  } else if (countryCode === "BR") {
    regulatoryRegion = "Brasil"
    liabilityShiftExpected = true
    complianceRisk = "BAIXA"
    regulationNote =
      "Bacen e FEBRABAN incentivam adoção de 3DS. Alta adoção por bancos tradicionais e fintechs. " +
      "Sem mandato federal explícito, mas amplamente adotado pelo mercado."
  } else if (countryCode === "AU" || countryCode === "NZ") {
    regulatoryRegion = "Oceania"
    liabilityShiftExpected = true
    complianceRisk = "BAIXA"
    regulationNote = "Alta adoção bancária. Liability shift quando 3DS é utilizado."
  } else if (countryCode === "CA") {
    regulatoryRegion = "Canadá"
    liabilityShiftExpected = true
    complianceRisk = "BAIXA"
    regulationNote = "Alta adoção. FCAC supervisiona. Liability shift quando 3DS é utilizado."
  } else if (countryCode === "US") {
    regulatoryRegion = "Estados Unidos"
    liabilityShiftExpected = false
    complianceRisk = "MEDIA"
    regulationNote =
      "EUA não possui mandato federal para 3DS. Adoção varia por emissor e gateway. " +
      "Liability shift ocorre somente quando 3DS é implementado e o emissor participa."
  } else if (["MX", "CO", "CL", "PE", "AR"].includes(countryCode)) {
    regulatoryRegion = "América Latina"
    liabilityShiftExpected = false
    complianceRisk = "MEDIA"
    regulationNote =
      "Adoção crescente na América Latina. Sem mandato regional, varia por país e emissor. " +
      "Recomendado verificar política do gateway e emissor específico."
  } else if (["NG", "KE", "GH", "VE", "PY"].includes(countryCode)) {
    regulatoryRegion = "Mercados Emergentes (baixo)"
    liabilityShiftExpected = false
    complianceRisk = "ALTA"
    regulationNote =
      "País com histórico de baixa maturidade em autenticação 3DS. " +
      "Risco de fraude elevado. Recomenda-se exigir autenticação adicional."
  } else if (["JP", "SG", "CH"].includes(countryCode)) {
    regulatoryRegion = "Mercados Desenvolvidos (Ásia/Outros)"
    liabilityShiftExpected = true
    complianceRisk = "BAIXA"
    regulationNote = "Alta maturidade financeira. Liability shift quando 3DS é utilizado."
  } else {
    regulatoryRegion = config.name || "Região não classificada"
    liabilityShiftExpected = config.maturity === "ALTA"
    complianceRisk = config.maturity === "ALTA" ? "BAIXA" : config.maturity === "MEDIA" ? "MEDIA" : "ALTA"
    regulationNote = config.notes || "Framework regulatório não catalogado para este país."
  }

  return {
    regulatoryRegion,
    threeDSMandateLevel: mandateLevel,
    regulationNote,
    liabilityShiftExpected,
    complianceRisk,
  }
}
