/**
 * Neutrino API Integration for BIN Lookup
 * https://www.neutrinoapi.net/
 */

export interface NeutrinoResponse {
  bin?: string
  valid?: boolean
  card_brand?: string
  card_type?: string
  card_category?: string
  issuer_name?: string
  issuer_website?: string
  issuer_phone?: string
  country_code?: string
  country_name?: string
  country_iso3?: string
  country_continent?: string
  country_population?: number
  currency_code?: string
  currency_name?: string
  is_commercial?: boolean
  is_prepaid?: boolean
  is_3d_secure?: boolean
  risk_level?: string
  [key: string]: unknown
}

export async function callNeutrinoApi(bin: string): Promise<NeutrinoResponse> {
  const apiKey = process.env.NEUTRINO_API_KEY
  const userId = process.env.NEUTRINO_USER_ID

  if (!apiKey || !userId) {
    console.error("[Neutrino] API credentials missing")
    throw new Error("Neutrino API credentials not configured")
  }

  try {
    const response = await fetch("https://neutrinoapi.net/bin-lookup", {
      method: "POST",
      headers: {
        "User-ID": userId,
        "API-Key": apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "bin-number": bin.replace(/\s/g, "").substring(0, 8),
      }).toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Neutrino] API error ${response.status}:`, errorText)
      throw new Error(`Neutrino API error: ${response.status} - ${errorText}`)
    }

    const data: NeutrinoResponse = await response.json()
    return data
  } catch (error) {
    console.error("[Neutrino] Request failed:", error)
    throw error
  }
}

/**
 * Converts Neutrino API response to internal BIN data format
 */
export function convertNeutrinoResponse(data: NeutrinoResponse): Record<string, unknown> {
  return {
    bin: data.bin,
    valid: data.valid ?? false,
    brand: data.card_brand || "UNKNOWN",
    type: data.card_type || "UNKNOWN",
    category: data.card_category || null,
    issuer: data.issuer_name || null,
    issuerWebsite: data.issuer_website || null,
    issuerPhone: data.issuer_phone || null,
    countryCode: data.country_code || null,
    countryName: data.country_name || null,
    countryIso3: data.country_iso3 || null,
    countryContinent: data.country_continent || null,
    countryPopulation: data.country_population || null,
    currency: data.currency_code || null,
    currencyName: data.currency_name || null,
    isCommercial: data.is_commercial ?? false,
    isPrepaid: data.is_prepaid ?? false,
    is3dSecure: data.is_3d_secure ?? false,
    riskLevel: data.risk_level || "UNKNOWN",
  }
}
