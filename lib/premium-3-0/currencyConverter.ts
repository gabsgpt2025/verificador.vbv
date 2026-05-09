// lib/premium-3-0/currencyConverter.ts
// Conversor de moedas — agora delegando ao ExchangeRateService SSOT
// Mantém interface pública compatível para não quebrar consumidores existentes

import {
  getRatesSync,
  convertCurrency as convertCurrencyAsync,
  getExchangeRates,
  type ExchangeRates,
} from "./services/exchangeRateService"

export interface ConversionRecord {
  id: string
  fromCurrency: string
  toCurrency: string
  amount: number
  result: number
  rate: number
  timestamp: string
}

const CURRENCY_INFO: { [key: string]: { name: string; symbol: string; flag: string } } = {
  USD: { name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  EUR: { name: "Euro", symbol: "€", flag: "🇪🇺" },
  GBP: { name: "British Pound", symbol: "£", flag: "🇬🇧" },
  JPY: { name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  CAD: { name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  AUD: { name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  CHF: { name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  CNY: { name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
  SEK: { name: "Swedish Krona", symbol: "kr", flag: "🇸🇪" },
  NZD: { name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },
  MXN: { name: "Mexican Peso", symbol: "$", flag: "🇲🇽" },
  SGD: { name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  HKD: { name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
  NOK: { name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴" },
  TRY: { name: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
  BRL: { name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  INR: { name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  KRW: { name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  ZAR: { name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  RUB: { name: "Russian Ruble", symbol: "₽", flag: "🇷🇺" },
}

export class CurrencyConverter {
  /**
   * Converte valor entre moedas usando taxas reais do ExchangeRateService.
   * Versão síncrona usa cache em memória / fallback estático.
   */
  static convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
    const from = fromCurrency.toUpperCase()
    const to = toCurrency.toUpperCase()
    if (from === to) return amount

    const { rates } = getRatesSync()
    const fromRate = rates[from] || 1
    const toRate = rates[to] || 1

    const usdAmount = amount / fromRate
    return Number.parseFloat((usdAmount * toRate).toFixed(2))
  }

  /**
   * Converte valor entre moedas usando taxas REAIS da API (async).
   */
  static async convertAmountAsync(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<{ result: number; rate: number; source: ExchangeRates["source"] }> {
    return convertCurrencyAsync(amount, fromCurrency, toCurrency)
  }

  static convertToMultipleCurrencies(amount: number, baseCurrency: string): { [currency: string]: number } {
    const { rates } = getRatesSync()
    const conversions: { [currency: string]: number } = {}

    for (const currency of Object.keys(rates)) {
      if (currency !== baseCurrency.toUpperCase()) {
        conversions[currency] = this.convertAmount(amount, baseCurrency, currency)
      }
    }

    return conversions
  }

  static getSupportedCurrencies(): string[] {
    const { rates } = getRatesSync()
    return Object.keys(rates).sort()
  }

  static getRealtimeRate(
    fromCurrency: string,
    toCurrency: string,
  ): { rate: number; change: number; timestamp: string; source: ExchangeRates["source"] } {
    const { rates, source, lastUpdated } = getRatesSync()
    const fromRate = rates[fromCurrency.toUpperCase()] || 1
    const toRate = rates[toCurrency.toUpperCase()] || 1

    return {
      rate: toRate / fromRate,
      change: 0,
      timestamp: lastUpdated,
      source,
    }
  }

  static getCurrencyInfo(currency: string) {
    return CURRENCY_INFO[currency.toUpperCase()] || { name: currency, symbol: currency, flag: "🌍" }
  }

  static getPopularPairs(): Array<{ from: string; to: string; rate: number }> {
    const { rates } = getRatesSync()
    const pairs = [
      { from: "USD", to: "EUR" },
      { from: "USD", to: "GBP" },
      { from: "USD", to: "JPY" },
      { from: "EUR", to: "GBP" },
      { from: "USD", to: "CAD" },
      { from: "USD", to: "AUD" },
      { from: "USD", to: "BRL" },
    ]

    return pairs.map((pair) => ({
      ...pair,
      rate: (rates[pair.to] || 1) / (rates[pair.from] || 1),
    }))
  }

  static trackConversion(fromCurrency: string, toCurrency: string, amount: number, result: number): ConversionRecord {
    const conversion: ConversionRecord = {
      id: Date.now().toString(),
      fromCurrency,
      toCurrency,
      amount,
      result,
      rate: result / amount,
      timestamp: new Date().toISOString(),
    }

    if (typeof window !== "undefined") {
      const history = JSON.parse(localStorage.getItem("currency_conversions") || "[]")
      history.unshift(conversion)
      localStorage.setItem("currency_conversions", JSON.stringify(history.slice(0, 50)))
    }

    return conversion
  }

  static getConversionHistory(): Array<ConversionRecord> {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("currency_conversions") || "[]")
    }
    return []
  }
}
