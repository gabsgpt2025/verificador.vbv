// lib/premium-3-0/normalizeBinApiResponse.ts
// Normaliza resposta de qualquer API para BinApiData padrão

import type { BinApiData } from "./types"

type ApiProvider = "NEUTRINO" | "FRAUDLABS" | "BINLIST" | "INTERNAL" | "UNKNOWN"

// Normaliza resposta da API Neutrino
// Suporta tanto dash-case (docs oficiais: card-brand) quanto snake_case (card_brand)
// para máxima robustez independente da versão da API.
function normalizeNeutrino(raw: Record<string, unknown>, bin: string): BinApiData {
  // Tenta dash-case primeiro (padrão docs Neutrino), com fallback para snake_case
  const get = (dashKey: string, snakeKey: string): unknown => raw[dashKey] ?? raw[snakeKey]

  const isCommercialVal = get("is-commercial", "is_commercial")
  const isPrepaidVal = get("prepaid", "is_prepaid")

  return {
    bin,
    binLength: bin.length,
    brand: get("card-brand", "card_brand") as string | undefined,
    type: get("card-type", "card_type") as string | undefined,
    category: get("card-category", "card_category") as string | undefined,
    countryCode: get("country-code", "country_code") as string | undefined,
    countryName: (get("country", "country_name")) as string | undefined,
    currency: get("currency-code", "currency_code") as string | undefined,
    issuer: (get("issuer", "issuer_name") as string | null) ?? null,
    issuerWebsite: (get("issuer-website", "issuer_website") as string | null) ?? null,
    issuerPhone: (get("issuer-phone", "issuer_phone") as string | null) ?? null,
    isCommercial: isCommercialVal === true || isCommercialVal === "true",
    isPrepaid: isPrepaidVal === true || isPrepaidVal === "true",
    source: "NEUTRINO",
    raw,
  }
}

// Normaliza resposta do FraudLabs
function normalizeFraudLabs(raw: Record<string, unknown>, bin: string): BinApiData {
  return {
    bin,
    binLength: bin.length,
    brand: raw["card_brand"] as string | undefined,
    type: raw["card_type"] as string | undefined,
    category: raw["card_subtype"] as string | undefined,
    countryCode: raw["card_issuing_country_code"] as string | undefined,
    countryName: raw["card_issuing_country"] as string | undefined,
    currency: undefined,
    issuer: (raw["card_issuing_bank"] as string | null) ?? null,
    issuerWebsite: null,
    issuerPhone: null,
    isCommercial: raw["is_business"] === true || raw["is_business"] === "true",
    isPrepaid: raw["is_prepaid"] === true || raw["is_prepaid"] === "true",
    source: "FRAUDLABS",
    raw,
  }
}

// Normaliza resposta do Binlist (binlist.net)
function normalizeBinlist(raw: Record<string, unknown>, bin: string): BinApiData {
  const country = raw["country"] as Record<string, unknown> | undefined
  const bank = raw["bank"] as Record<string, unknown> | undefined
  return {
    bin,
    binLength: bin.length,
    brand: (raw["scheme"] as string | undefined)?.toUpperCase(),
    type: raw["type"] as string | undefined,
    category: raw["category"] as string | undefined,
    countryCode: country?.["alpha2"] as string | undefined,
    countryName: country?.["name"] as string | undefined,
    currency: country?.["currency"] as string | undefined,
    issuer: (bank?.["name"] as string | null) ?? null,
    issuerWebsite: (bank?.["url"] as string | null) ?? null,
    issuerPhone: (bank?.["phone"] as string | null) ?? null,
    isCommercial: raw["commercial"] === true,
    isPrepaid: raw["prepaid"] === true,
    source: "BINLIST",
    raw,
  }
}

// Normaliza entrada interna (dados manuais/override)
function normalizeInternal(raw: Record<string, unknown>, bin: string): BinApiData {
  return {
    bin,
    binLength: bin.length,
    brand: raw["brand"] as string | undefined,
    type: raw["type"] as string | undefined,
    category: raw["category"] as string | undefined,
    countryCode: raw["countryCode"] as string | undefined,
    countryName: raw["countryName"] as string | undefined,
    currency: raw["currency"] as string | undefined,
    issuer: (raw["issuer"] as string | null) ?? null,
    issuerWebsite: (raw["issuerWebsite"] as string | null) ?? null,
    issuerPhone: (raw["issuerPhone"] as string | null) ?? null,
    isCommercial: raw["isCommercial"] === true,
    isPrepaid: raw["isPrepaid"] === true,
    source: "INTERNAL",
    raw,
  }
}

export function normalizeBinApiResponse(
  provider: ApiProvider,
  rawResponse: Record<string, unknown>,
  bin: string,
): BinApiData {
  switch (provider) {
    case "NEUTRINO":
      return normalizeNeutrino(rawResponse, bin)
    case "FRAUDLABS":
      return normalizeFraudLabs(rawResponse, bin)
    case "BINLIST":
      return normalizeBinlist(rawResponse, bin)
    case "INTERNAL":
      return normalizeInternal(rawResponse, bin)
    default:
      return {
        bin,
        binLength: bin.length,
        source: "UNKNOWN",
        raw: rawResponse,
      }
  }
}
