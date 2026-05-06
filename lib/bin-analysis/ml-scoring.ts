import type { RiskFactors } from "./types"

export class MLRiskScoring {
  private static readonly WEIGHTS = {
    geographicRisk: 0.25,
    bankReputation: 0.2,
    cardTypeRisk: 0.15,
    historicalFraud: 0.25,
    velocityRisk: 0.15,
  }

  private static readonly HIGH_RISK_COUNTRIES = ["NG", "GH", "PK", "BD", "ID", "VN", "PH", "MY"]

  private static readonly HIGH_RISK_BINS = ["4000", "4111", "4444", "5555", "3782"]

  static calculateRiskScore(bin: string, country: string, bank: string, type: string): number {
    const factors = this.analyzeRiskFactors(bin, country, bank, type)

    let score = 0
    score += factors.geographicRisk * this.WEIGHTS.geographicRisk
    score += factors.bankReputation * this.WEIGHTS.bankReputation
    score += factors.cardTypeRisk * this.WEIGHTS.cardTypeRisk
    score += factors.historicalFraud * this.WEIGHTS.historicalFraud
    score += factors.velocityRisk * this.WEIGHTS.velocityRisk

    return Math.min(Math.max(score * 100, 0), 100)
  }

  private static analyzeRiskFactors(bin: string, country: string, bank: string, type: string): RiskFactors {
    return {
      geographicRisk: this.calculateGeographicRisk(country),
      bankReputation: this.calculateBankRisk(bank),
      cardTypeRisk: this.calculateCardTypeRisk(type),
      historicalFraud: this.calculateHistoricalRisk(bin),
      velocityRisk: this.calculateVelocityRisk(bin),
    }
  }

  private static calculateGeographicRisk(country: string): number {
    if (this.HIGH_RISK_COUNTRIES.includes(country)) return 0.8
    if (["US", "CA", "GB", "DE", "FR", "AU"].includes(country)) return 0.1
    return 0.4
  }

  private static calculateBankRisk(bank: string): number {
    const trustedBanks = ["CHASE", "WELLS FARGO", "BANK OF AMERICA", "CITIBANK"]
    if (trustedBanks.some((b) => bank.toUpperCase().includes(b))) return 0.1
    return 0.5
  }

  private static calculateCardTypeRisk(type: string): number {
    switch (type.toLowerCase()) {
      case "credit":
        return 0.3
      case "debit":
        return 0.2
      case "prepaid":
        return 0.7
      default:
        return 0.5
    }
  }

  private static calculateHistoricalRisk(bin: string): number {
    if (this.HIGH_RISK_BINS.some((riskBin) => bin.startsWith(riskBin))) return 0.9
    return Math.random() * 0.3 // Simulated historical data
  }

  private static calculateVelocityRisk(bin: string): number {
    // Simulated velocity analysis
    return Math.random() * 0.4
  }

  static getRiskLevel(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    if (score >= 80) return "CRITICAL"
    if (score >= 60) return "HIGH"
    if (score >= 40) return "MEDIUM"
    return "LOW"
  }
}
