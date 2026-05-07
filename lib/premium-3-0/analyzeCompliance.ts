// lib/premium-3-0/analyzeCompliance.ts
// Análise de compliance e mandatos regulatórios 3DS por região

import type { BinApiData, BinComplianceAnalysis } from "./types"
import { getCountryMaturity } from "./country3dsMaturity"

const PSD2_COUNTRIES = new Set(["GB", "DE", "FR", "ES", "IT", "NL", "BE", "PT", "SE", "NO", "DK", "FI", "AT", "CH", "IE", "LU"])

export function analyzeCompliance(binData: BinApiData): BinComplianceAnalysis {
  const countryCode = binData.countryCode?.toUpperCase()
  const maturity = getCountryMaturity(countryCode)

  if (!countryCode || !maturity) {
    return {
      regulatoryRegion: "UNKNOWN",
      threeDSMandateLevel: "UNKNOWN",
      regulationNote: "País não identificado. Não é possível determinar mandato regulatório.",
      complianceRisk: "UNKNOWN",
    }
  }

  // Europa/UK — PSD2/SCA
  if (PSD2_COUNTRIES.has(countryCode) || maturity.mandate === "PSD2_SCA" || maturity.mandate === "SCA_STRONG") {
    return {
      regulatoryRegion: countryCode === "GB" ? "Reino Unido (pós-Brexit SCA)" : "União Europeia (PSD2/SCA)",
      threeDSMandateLevel: "MANDATORY",
      regulationNote: `Região com mandato regulatório forte. ${maturity.note}`,
      complianceRisk: "LOW",
    }
  }

  // Índia — RBI
  if (countryCode === "IN") {
    return {
      regulatoryRegion: "Índia (RBI — Autenticação Adicional)",
      threeDSMandateLevel: "MANDATORY",
      regulationNote: maturity.note,
      complianceRisk: "LOW",
    }
  }

  // Brasil
  if (countryCode === "BR") {
    return {
      regulatoryRegion: "Brasil (BACEN/Bancos Nacionais)",
      threeDSMandateLevel: "STRONG",
      regulationNote: maturity.note,
      complianceRisk: "LOW",
    }
  }

  // Canadá/Austrália
  if (countryCode === "CA" || countryCode === "AU") {
    return {
      regulatoryRegion: countryCode === "CA" ? "Canadá" : "Austrália",
      threeDSMandateLevel: "STRONG",
      regulationNote: maturity.note,
      complianceRisk: "LOW",
    }
  }

  // EUA
  if (countryCode === "US") {
    return {
      regulatoryRegion: "Estados Unidos",
      threeDSMandateLevel: "OPTIONAL",
      regulationNote: maturity.note,
      complianceRisk: "MEDIUM",
    }
  }

  // América Latina (média)
  if (["MX", "AR", "CL", "CO", "PE"].includes(countryCode)) {
    return {
      regulatoryRegion: "América Latina",
      threeDSMandateLevel: "MODERATE",
      regulationNote: maturity.note,
      complianceRisk: "MEDIUM",
    }
  }

  // Países com baixa maturidade
  if (maturity.maturity === "LOW") {
    return {
      regulatoryRegion: countryCode,
      threeDSMandateLevel: "LOW",
      regulationNote: maturity.note,
      complianceRisk: "HIGH",
    }
  }

  return {
    regulatoryRegion: countryCode,
    threeDSMandateLevel: "UNKNOWN",
    regulationNote: maturity.note,
    complianceRisk: "UNKNOWN",
  }
}
