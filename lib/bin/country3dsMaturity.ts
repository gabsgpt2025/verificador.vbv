// lib/bin/country3dsMaturity.ts
// Tabela centralizada de maturidade 3DS por país

export type CountryMaturity = "HIGH" | "MEDIUM" | "LOW"
export type MandateLevel =
  | "PSD2_SCA"
  | "SCA_STRONG"
  | "BROAD_ADOPTION"
  | "STRONG_AUTH_REQUIRED"
  | "STRONG_ADOPTION"
  | "OPTIONAL_MARKET_DRIVEN"
  | "VARIABLE"
  | "WEAK"

export type CountryMaturityEntry = {
  maturity: CountryMaturity
  mandate: MandateLevel
  note: string
}

export const COUNTRY_3DS_MATURITY: Record<string, CountryMaturityEntry> = {
  BR: {
    maturity: "HIGH",
    mandate: "BROAD_ADOPTION",
    note: "Brasil possui ampla adoção de autenticação 3DS em bancos e gateways nacionais.",
  },
  US: {
    maturity: "MEDIUM",
    mandate: "OPTIONAL_MARKET_DRIVEN",
    note: "Nos EUA, 3DS é comum, mas não obrigatório universalmente.",
  },
  GB: {
    maturity: "HIGH",
    mandate: "SCA_STRONG",
    note: "Reino Unido exige Strong Customer Authentication (SCA) sob PSD2 pós-Brexit.",
  },
  DE: {
    maturity: "HIGH",
    mandate: "PSD2_SCA",
    note: "Alemanha segue PSD2/SCA com forte mandato regulatório.",
  },
  FR: {
    maturity: "HIGH",
    mandate: "PSD2_SCA",
    note: "França segue PSD2/SCA com forte mandato regulatório.",
  },
  ES: {
    maturity: "HIGH",
    mandate: "PSD2_SCA",
    note: "Espanha segue PSD2/SCA com forte mandato regulatório.",
  },
  IT: {
    maturity: "HIGH",
    mandate: "PSD2_SCA",
    note: "Itália segue PSD2/SCA com forte mandato regulatório.",
  },
  IN: {
    maturity: "HIGH",
    mandate: "STRONG_AUTH_REQUIRED",
    note: "Índia exige autenticação adicional obrigatória para transações online.",
  },
  CA: {
    maturity: "HIGH",
    mandate: "STRONG_ADOPTION",
    note: "Canadá possui forte adoção de autenticação 3DS.",
  },
  AU: {
    maturity: "HIGH",
    mandate: "STRONG_ADOPTION",
    note: "Austrália possui forte adoção de autenticação 3DS.",
  },
  MX: {
    maturity: "MEDIUM",
    mandate: "VARIABLE",
    note: "México possui adoção variável de 3DS entre emissores.",
  },
  AR: {
    maturity: "MEDIUM",
    mandate: "VARIABLE",
    note: "Argentina possui adoção variável de 3DS entre emissores.",
  },
  CL: {
    maturity: "MEDIUM",
    mandate: "VARIABLE",
    note: "Chile possui adoção variável de 3DS entre emissores.",
  },
  CO: {
    maturity: "MEDIUM",
    mandate: "VARIABLE",
    note: "Colômbia possui adoção variável de 3DS entre emissores.",
  },
  PE: {
    maturity: "MEDIUM",
    mandate: "VARIABLE",
    note: "Peru possui adoção variável de 3DS entre emissores.",
  },
  PY: {
    maturity: "LOW",
    mandate: "WEAK",
    note: "Paraguai possui baixa maturidade em autenticação 3DS.",
  },
  VE: {
    maturity: "LOW",
    mandate: "WEAK",
    note: "Venezuela possui baixa maturidade em autenticação 3DS.",
  },
  NG: {
    maturity: "LOW",
    mandate: "VARIABLE",
    note: "Nigéria possui adoção variável e baixa maturidade em 3DS.",
  },
  KE: {
    maturity: "LOW",
    mandate: "VARIABLE",
    note: "Quênia possui adoção variável e baixa maturidade em 3DS.",
  },
  // European Union additional members
  NL: {
    maturity: "HIGH",
    mandate: "PSD2_SCA",
    note: "Países Baixos seguem PSD2/SCA com forte mandato regulatório.",
  },
  BE: {
    maturity: "HIGH",
    mandate: "PSD2_SCA",
    note: "Bélgica segue PSD2/SCA com forte mandato regulatório.",
  },
  PT: {
    maturity: "HIGH",
    mandate: "PSD2_SCA",
    note: "Portugal segue PSD2/SCA com forte mandato regulatório.",
  },
  SE: {
    maturity: "HIGH",
    mandate: "PSD2_SCA",
    note: "Suécia segue PSD2/SCA com forte mandato regulatório.",
  },
  NO: {
    maturity: "HIGH",
    mandate: "SCA_STRONG",
    note: "Noruega segue SCA com forte mandato regulatório.",
  },
}

export function getCountryMaturity(countryCode?: string): CountryMaturityEntry | null {
  if (!countryCode) return null
  return COUNTRY_3DS_MATURITY[countryCode.toUpperCase()] ?? null
}
