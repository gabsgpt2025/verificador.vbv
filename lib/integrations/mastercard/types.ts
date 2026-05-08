export interface MastercardBinLookupAccountRange {
  accountRangeLow?: string
  accountRangeHigh?: string
  panLength?: number | string
  brand?: string
  acceptanceBrand?: string
  productCode?: string
  productName?: string
  productCategory?: string
  cardType?: string
  consumerOrCommercial?: string
  countryCode?: string
  countryName?: string
  issuerName?: string
  issuerCountry?: string
}

export interface MastercardBinLookupApiResponse {
  bin?: string
  binLength?: number | string
  brand?: string
  acceptanceBrand?: string
  productCode?: string
  productName?: string
  productCategory?: string
  cardType?: string
  consumerOrCommercial?: string
  countryCode?: string
  countryName?: string
  issuerName?: string
  issuerCountry?: string
  accountRanges?: MastercardBinLookupAccountRange[]
  data?: MastercardBinLookupApiResponse
  [key: string]: unknown
}

export interface MastercardBinResult {
  bin: string
  binLength: number
  brand: "MASTERCARD" | "MAESTRO" | "CIRRUS" | "UNKNOWN"
  productCode: string
  productName: string
  productCategory: "CONSUMER" | "COMMERCIAL" | "PREPAID"
  cardType: "CREDIT" | "DEBIT" | "CHARGE" | "PREPAID"
  countryCode: string
  countryName: string
  issuerName: string
  issuerCountry: string
  acceptanceBrand: string
  source: "MASTERCARD"
  raw: unknown
}
