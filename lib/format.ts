export const formatNumber = (value: number, locale = 'pt-BR') => new Intl.NumberFormat(locale).format(value)

export const formatCurrency = (value: number, currency: 'BRL' | 'USD' | 'EUR' = 'BRL', locale = 'pt-BR') =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

export const formatPercent = (value: number, locale = 'pt-BR') =>
  new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 2,
  }).format(value)

export const formatRelativeTime = (date: Date | string | number, locale = 'pt-BR') => {
  const target = new Date(date)
  const seconds = Math.round((target.getTime() - Date.now()) / 1000)

  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ]

  for (const [unit, divisor] of ranges) {
    if (Math.abs(seconds) >= divisor || unit === 'second') {
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(Math.round(seconds / divisor), unit)
    }
  }

  return ''
}

export const maskBin = (bin: string) => `${bin.slice(0, 6)}••••••`
