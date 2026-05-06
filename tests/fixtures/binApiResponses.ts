// Test fixtures — Mock BIN API responses for 10 test scenarios
// Used by: tests/binAnalyzer.test.ts

import type { RawBINApiResponse } from "../../src/lib/intelligence/types"

// Scenario 1: Visa credit card from USA, no issuer
export const visaCreditUSANoIssuer: RawBINApiResponse = {
  bin: "405708",
  scheme: "visa",
  type: "credit",
  prepaid: false,
  country: {
    alpha2: "US",
    name: "United States",
    currency: "USD",
    numeric: "840",
    latitude: 38,
    longitude: -97,
    emoji: "🇺🇸",
  },
  bank: undefined,
}

// Scenario 2: Mastercard debit card from USA
export const mastercardDebitUSA: RawBINApiResponse = {
  bin: "510510",
  scheme: "mastercard",
  type: "debit",
  prepaid: false,
  country: {
    alpha2: "US",
    name: "United States",
    currency: "USD",
    numeric: "840",
    latitude: 38,
    longitude: -97,
    emoji: "🇺🇸",
  },
  bank: {
    name: "Bank of America",
    url: "https://www.bankofamerica.com",
    phone: "+1-800-432-1000",
    city: "Charlotte",
  },
}

// Scenario 3: Visa credit card from Brazil, known bank (Bradesco)
export const visaCreditBrazilKnownBank: RawBINApiResponse = {
  bin: "451357",
  scheme: "visa",
  type: "credit",
  prepaid: false,
  country: {
    alpha2: "BR",
    name: "Brazil",
    currency: "BRL",
    numeric: "076",
    latitude: -10,
    longitude: -55,
    emoji: "🇧🇷",
  },
  bank: {
    name: "Bradesco",
    url: "https://www.bradesco.com.br",
    phone: "+55-11-4004-0237",
    city: "Osasco",
  },
}

// Scenario 4: International prepaid card
export const prepaidInternational: RawBINApiResponse = {
  bin: "532959",
  scheme: "mastercard",
  type: "prepaid",
  prepaid: true,
  country: {
    alpha2: "MX",
    name: "Mexico",
    currency: "MXN",
    numeric: "484",
    latitude: 23,
    longitude: -102,
    emoji: "🇲🇽",
  },
  bank: undefined,
}

// Scenario 5: Commercial/business card (Visa Business)
export const visaCommercialCard: RawBINApiResponse = {
  bin: "405503",
  scheme: "visa",
  type: "credit",
  prepaid: false,
  commercial: true,
  country: {
    alpha2: "US",
    name: "United States",
    currency: "USD",
    numeric: "840",
    latitude: 38,
    longitude: -97,
    emoji: "🇺🇸",
  },
  bank: {
    name: "Chase Bank",
    url: "https://www.chase.com",
    phone: "+1-800-935-9935",
    city: "New York",
  },
}

// Scenario 6: Card with unknown country
export const unknownCountryCard: RawBINApiResponse = {
  bin: "999999",
  scheme: "visa",
  type: "credit",
  prepaid: false,
  country: undefined,
  bank: undefined,
}

// Scenario 7: Incomplete data — missing many fields
export const incompleteDataCard: RawBINApiResponse = {
  bin: "424242",
  // No scheme/brand
  // No type
  // No country
  // No bank
  prepaid: false,
}

// Scenario 8: Card from country with mandatory 3DS (India - RBI)
export const indiaMandatory3DS: RawBINApiResponse = {
  bin: "489353",
  scheme: "visa",
  type: "credit",
  prepaid: false,
  country: {
    alpha2: "IN",
    name: "India",
    currency: "INR",
    numeric: "356",
    latitude: 20,
    longitude: 77,
    emoji: "🇮🇳",
  },
  bank: {
    name: "HDFC Bank",
    url: "https://www.hdfcbank.com",
    phone: "+91-1800-202-6161",
    city: "Mumbai",
  },
}

// Scenario 9: Card from country with low 3DS maturity (Nigeria)
export const nigeriaLow3DS: RawBINApiResponse = {
  bin: "507338",
  scheme: "mastercard",
  type: "debit",
  prepaid: false,
  country: {
    alpha2: "NG",
    name: "Nigeria",
    currency: "NGN",
    numeric: "566",
    latitude: 10,
    longitude: 8,
    emoji: "🇳🇬",
  },
  bank: {
    name: "First Bank of Nigeria",
    url: "https://www.firstbanknigeria.com",
    phone: "+234-1-905-3000",
    city: "Lagos",
  },
}

// Scenario 10: Regional bank card (Elo - Brazil)
export const eloBrazilRegionalBank: RawBINApiResponse = {
  bin: "636368",
  scheme: "elo",
  type: "debit",
  prepaid: false,
  country: {
    alpha2: "BR",
    name: "Brazil",
    currency: "BRL",
    numeric: "076",
    latitude: -10,
    longitude: -55,
    emoji: "🇧🇷",
  },
  bank: {
    name: "Caixa Econômica Federal",
    url: "https://www.caixa.gov.br",
    phone: "+55-800-726-0101",
    city: "Brasília",
  },
}
