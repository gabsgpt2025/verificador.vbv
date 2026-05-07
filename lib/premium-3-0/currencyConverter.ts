// lib/premium-3-0/currencyConverter.ts
// TODO: Implement real exchange rate API (e.g., Open Exchange Rates, Fixer.io) — current version returns static rates

export class CurrencyConverter {
  private static readonly SUPPORTED_CURRENCIES = [
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "CAD",
    "AUD",
    "CHF",
    "CNY",
    "SEK",
    "NZD",
    "MXN",
    "SGD",
    "HKD",
    "NOK",
    "TRY",
    "BRL",
    "INR",
    "KRW",
    "ZAR",
    "RUB",
    "PLN",
    "CZK",
    "HUF",
    "ILS",
    "THB",
    "MYR",
    "PHP",
    "IDR",
    "VND",
    "EGP",
  ]

  private static readonly EXCHANGE_RATES: { [key: string]: number } = {
    USD: 1.0,
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.0,
    CAD: 1.25,
    AUD: 1.35,
    CHF: 0.92,
    CNY: 6.45,
    SEK: 8.75,
    NZD: 1.42,
    MXN: 20.5,
    SGD: 1.35,
    HKD: 7.8,
    NOK: 8.9,
    TRY: 8.5,
    BRL: 5.2,
    INR: 74.5,
    KRW: 1180.0,
    ZAR: 14.8,
    RUB: 73.2,
    PLN: 3.9,
    CZK: 21.5,
    HUF: 295.0,
    ILS: 3.2,
    THB: 31.5,
    MYR: 4.1,
    PHP: 50.2,
    IDR: 14250.0,
    VND: 22800.0,
    EGP: 15.7,
  }

  private static readonly CURRENCY_INFO: { [key: string]: { name: string; symbol: string; flag: string } } = {
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

  static convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
    const fromRate = this.EXCHANGE_RATES[fromCurrency] || 1
    const toRate = this.EXCHANGE_RATES[toCurrency] || 1

    const usdAmount = amount / fromRate
    return Number.parseFloat((usdAmount * toRate).toFixed(2))
  }

  static convertToMultipleCurrencies(amount: number, baseCurrency: string): { [currency: string]: number } {
    const conversions: { [currency: string]: number } = {}

    this.SUPPORTED_CURRENCIES.forEach((currency) => {
      if (currency !== baseCurrency) {
        conversions[currency] = this.convertAmount(amount, baseCurrency, currency)
      }
    })

    return conversions
  }

  static getSupportedCurrencies(): string[] {
    return [...this.SUPPORTED_CURRENCIES]
  }

  // TODO: Implement real exchange rate API (e.g., Open Exchange Rates, Fixer.io) — current version returns static rates
  static getRealtimeRate(
    fromCurrency: string,
    toCurrency: string,
  ): { rate: number; change: number; timestamp: string } {
    const baseRate = this.EXCHANGE_RATES[toCurrency] / this.EXCHANGE_RATES[fromCurrency]

    return {
      rate: baseRate,
      change: 0,
      timestamp: new Date().toISOString(),
    }
  }

  static getCurrencyInfo(currency: string) {
    return this.CURRENCY_INFO[currency] || { name: currency, symbol: currency, flag: "🌍" }
  }

  static getPopularPairs(): Array<{ from: string; to: string; rate: number }> {
    const pairs = [
      { from: "USD", to: "EUR" },
      { from: "USD", to: "GBP" },
      { from: "USD", to: "JPY" },
      { from: "EUR", to: "GBP" },
      { from: "USD", to: "CAD" },
      { from: "USD", to: "AUD" },
    ]

    return pairs.map((pair) => ({
      ...pair,
      rate: this.EXCHANGE_RATES[pair.to] / this.EXCHANGE_RATES[pair.from],
    }))
  }

  static trackConversion(fromCurrency: string, toCurrency: string, amount: number, result: number) {
    const conversion = {
      id: Date.now().toString(),
      fromCurrency,
      toCurrency,
      amount,
      result,
      rate: result / amount,
      timestamp: new Date().toISOString(),
    }

    // In production, save to database
    if (typeof window !== "undefined") {
      const history = JSON.parse(localStorage.getItem("currency_conversions") || "[]")
      history.unshift(conversion)
      localStorage.setItem("currency_conversions", JSON.stringify(history.slice(0, 50)))
    }

    return conversion
  }

  static getConversionHistory(): Array<any> {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("currency_conversions") || "[]")
    }
    return []
  }
}
