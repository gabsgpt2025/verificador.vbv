"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CyberText } from "@/components/cyberpunk/cyber-typography"
import { CurrencyConverter } from "@/lib/premium-3-0/currencyConverter"
import { ArrowRightLeft, TrendingUp, TrendingDown, RefreshCw, History, DollarSign } from "lucide-react"

export function CurrencyConverterWidget() {
  const [amount, setAmount] = useState("100")
  const [fromCurrency, setFromCurrency] = useState("USD")
  const [toCurrency, setToCurrency] = useState("EUR")
  const [result, setResult] = useState<number | null>(null)
  const [realtimeRate, setRealtimeRate] = useState<any>(null)
  const [popularPairs, setPopularPairs] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [isConverting, setIsConverting] = useState(false)

  useEffect(() => {
    updateRealtimeRate()
    loadPopularPairs()
    loadHistory()
  }, [fromCurrency, toCurrency])

  const updateRealtimeRate = () => {
    const rate = CurrencyConverter.getRealtimeRate(fromCurrency, toCurrency)
    setRealtimeRate(rate)
  }

  const loadPopularPairs = () => {
    const pairs = CurrencyConverter.getPopularPairs()
    setPopularPairs(pairs)
  }

  const loadHistory = () => {
    const conversionHistory = CurrencyConverter.getConversionHistory()
    setHistory(conversionHistory.slice(0, 5))
  }

  const handleConvert = () => {
    if (!amount || Number.parseFloat(amount) <= 0) return

    setIsConverting(true)

    setTimeout(() => {
      const convertedAmount = CurrencyConverter.convertAmount(Number.parseFloat(amount), fromCurrency, toCurrency)

      setResult(convertedAmount)

      // Track conversion
      CurrencyConverter.trackConversion(fromCurrency, toCurrency, Number.parseFloat(amount), convertedAmount)

      loadHistory()
      setIsConverting(false)
    }, 500)
  }

  const swapCurrencies = () => {
    const temp = fromCurrency
    setFromCurrency(toCurrency)
    setToCurrency(temp)
    setResult(null)
  }

  const fromInfo = CurrencyConverter.getCurrencyInfo(fromCurrency)
  const toInfo = CurrencyConverter.getCurrencyInfo(toCurrency)

  return (
    <div className="space-y-6">
      {/* Main Converter */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-mono text-primary neon-glow">
            <DollarSign className="h-5 w-5" />
            <span>CURRENCY CONVERTER</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-mono font-medium mb-2">Amount</label>
              <Input
                type="number"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-mono font-medium mb-2">From</label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background font-mono"
              >
                {CurrencyConverter.getSupportedCurrencies().map((currency) => {
                  const info = CurrencyConverter.getCurrencyInfo(currency)
                  return (
                    <option key={currency} value={currency}>
                      {info.flag} {currency}
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={swapCurrencies} className="p-2 bg-transparent">
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <label className="block text-sm font-mono font-medium mb-2">To</label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background font-mono"
              >
                {CurrencyConverter.getSupportedCurrencies().map((currency) => {
                  const info = CurrencyConverter.getCurrencyInfo(currency)
                  return (
                    <option key={currency} value={currency}>
                      {info.flag} {currency}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* Real-time Rate */}
          {realtimeRate && (
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/50">
              <div className="flex items-center space-x-2">
                <CyberText variant="caption" color="muted">
                  1 {fromInfo.symbol} {fromCurrency} =
                </CyberText>
                <CyberText className="font-mono font-bold">
                  {realtimeRate.rate} {toInfo.symbol} {toCurrency}
                </CyberText>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={realtimeRate.change >= 0 ? "default" : "destructive"} className="font-mono text-xs">
                  {realtimeRate.change >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(realtimeRate.change)}%
                </Badge>
                <Button variant="ghost" size="sm" onClick={updateRealtimeRate}>
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Convert Button and Result */}
          <div className="space-y-4">
            <Button onClick={handleConvert} disabled={isConverting || !amount} className="w-full" variant="accent">
              {isConverting ? "Converting..." : "Convert"}
            </Button>

            {result !== null && (
              <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <CyberText className="font-mono text-2xl font-bold text-primary">
                  {toInfo.symbol} {result.toLocaleString()}
                </CyberText>
                <CyberText variant="caption" color="muted">
                  {amount} {fromInfo.symbol} {fromCurrency} = {result.toLocaleString()} {toInfo.symbol} {toCurrency}
                </CyberText>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Popular Pairs and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Pairs */}
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 font-mono text-secondary neon-glow">
              <TrendingUp className="h-5 w-5" />
              <span>POPULAR PAIRS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {popularPairs.map((pair, index) => {
              const fromInfo = CurrencyConverter.getCurrencyInfo(pair.from)
              const toInfo = CurrencyConverter.getCurrencyInfo(pair.to)
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-muted/20 rounded cursor-pointer"
                  onClick={() => {
                    setFromCurrency(pair.from)
                    setToCurrency(pair.to)
                    setResult(null)
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{fromInfo.flag}</span>
                    <CyberText variant="caption" className="font-mono">
                      {pair.from}/{pair.to}
                    </CyberText>
                  </div>
                  <CyberText variant="caption" className="font-mono font-bold">
                    {pair.rate.toFixed(4)}
                  </CyberText>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Conversion History */}
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 font-mono text-accent neon-glow">
              <History className="h-5 w-5" />
              <span>RECENT CONVERSIONS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length === 0 ? (
              <CyberText color="muted" className="text-center py-4">
                No conversions yet
              </CyberText>
            ) : (
              history.map((conversion) => {
                const fromInfo = CurrencyConverter.getCurrencyInfo(conversion.fromCurrency)
                const toInfo = CurrencyConverter.getCurrencyInfo(conversion.toCurrency)
                return (
                  <div key={conversion.id} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                    <div>
                      <CyberText variant="caption" className="font-mono">
                        {fromInfo.symbol} {conversion.amount} → {toInfo.symbol} {conversion.result.toLocaleString()}
                      </CyberText>
                      <CyberText variant="caption" color="muted" className="block">
                        {conversion.fromCurrency}/{conversion.toCurrency}
                      </CyberText>
                    </div>
                    <CyberText variant="caption" color="muted">
                      {new Date(conversion.timestamp).toLocaleDateString()}
                    </CyberText>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
