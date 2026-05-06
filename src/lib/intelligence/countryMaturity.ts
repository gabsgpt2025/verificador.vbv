// VeriFiBIN 2.0 — Country 3DS Maturity Configuration
// Central configuration for 3DS regulatory maturity by country
// IMPORTANT: This is the single source of truth — never hardcode country maturity elsewhere

export type ThreeDSMaturityLevel = "ALTA" | "MEDIA" | "BAIXA" | "VARIAVEL" | "DESCONHECIDA"

export interface CountryMaturityConfig {
  code: string
  name: string
  maturity: ThreeDSMaturityLevel
  mandateLevel: "OBRIGATORIO" | "FORTE" | "MODERADO" | "OPCIONAL" | "BAIXO" | "DESCONHECIDO"
  regulatoryFramework: string
  notes: string
}

// Full country maturity registry
// Sources: PSD2/SCA (EU/UK), RBI mandate (India), industry reports
export const COUNTRY_MATURITY_REGISTRY: Record<string, CountryMaturityConfig> = {
  // ── ALTA MATURIDADE 3DS ──────────────────────────────────────────────────
  AT: {
    code: "AT", name: "Austria", maturity: "ALTA", mandateLevel: "FORTE",
    regulatoryFramework: "PSD2/SCA", notes: "EU member — SCA obrigatório desde 2021",
  },
  AU: {
    code: "AU", name: "Australia", maturity: "ALTA", mandateLevel: "MODERADO",
    regulatoryFramework: "APRA/ASIC guidelines", notes: "Alta adoção por grandes bancos",
  },
  BE: {
    code: "BE", name: "Belgium", maturity: "ALTA", mandateLevel: "FORTE",
    regulatoryFramework: "PSD2/SCA", notes: "EU member — SCA obrigatório",
  },
  BR: {
    code: "BR", name: "Brazil", maturity: "ALTA", mandateLevel: "MODERADO",
    regulatoryFramework: "Bacen / FEBRABAN", notes: "Alta adoção por bancos tradicionais e fintechs",
  },
  CA: {
    code: "CA", name: "Canada", maturity: "ALTA", mandateLevel: "MODERADO",
    regulatoryFramework: "FCAC / Visa/MC programs", notes: "Alta adoção bancária",
  },
  DE: {
    code: "DE", name: "Germany", maturity: "ALTA", mandateLevel: "FORTE",
    regulatoryFramework: "PSD2/SCA", notes: "EU — SCA rigoroso, alta conformidade",
  },
  DK: {
    code: "DK", name: "Denmark", maturity: "ALTA", mandateLevel: "FORTE",
    regulatoryFramework: "PSD2/SCA", notes: "EU member",
  },
  ES: {
    code: "ES", name: "Spain", maturity: "ALTA", mandateLevel: "FORTE",
    regulatoryFramework: "PSD2/SCA", notes: "EU member",
  },
  FI: {
    code: "FI", name: "Finland", maturity: "ALTA", mandateLevel: "FORTE",
    regulatoryFramework: "PSD2/SCA", notes: "EU member",
  },
  FR: {
    code: "FR", name: "France", maturity: "ALTA", mandateLevel: "FORTE",
    regulatoryFramework: "PSD2/SCA", notes: "EU member — alta conformidade",
  },
  GB: {
    code: "GB", name: "United Kingdom", maturity: "ALTA", mandateLevel: "FORTE",
    regulatoryFramework: "FCA/SCA (UK)", notes: "SCA obrigatório pós-Brexit mantido",
  },
  IE: {
    code: "IE", name: "Ireland", maturity: "ALTA", mandateLevel: "FORTE",
    regulatoryFramework: "PSD2/SCA", notes: "EU member",
  },
  IN: {
    code: "IN", name: "India", maturity: "ALTA", mandateLevel: "OBRIGATORIO",
    regulatoryFramework: "RBI mandate", notes: "2FA/AFA obrigatório por RBI desde 2009",
  },
  IT: {
    code: "IT", name: "Italy", maturity: "ALTA", mandateLevel: "FORTE",
    regulatoryFramework: "PSD2/SCA", notes: "EU member",
  },
  JP: {
    code: "JP", name: "Japan", maturity: "ALTA", mandateLevel: "MODERADO",
    regulatoryFramework: "FSA guidelines", notes: "Alta adoção por emissores japoneses",
  },
  NL: {
    code: "NL", name: "Netherlands", maturity: "ALTA", mandateLevel: "FORTE",
    regulatoryFramework: "PSD2/SCA", notes: "EU member",
  },
  NO: {
    code: "NO", name: "Norway", maturity: "ALTA", mandateLevel: "FORTE",
    regulatoryFramework: "PSD2/SCA (EEA)", notes: "EEA — aplica PSD2",
  },
  PT: {
    code: "PT", name: "Portugal", maturity: "ALTA", mandateLevel: "FORTE",
    regulatoryFramework: "PSD2/SCA", notes: "EU member",
  },
  SE: {
    code: "SE", name: "Sweden", maturity: "ALTA", mandateLevel: "FORTE",
    regulatoryFramework: "PSD2/SCA", notes: "EU member",
  },
  SG: {
    code: "SG", name: "Singapore", maturity: "ALTA", mandateLevel: "MODERADO",
    regulatoryFramework: "MAS TRM", notes: "MAS exige autenticação forte",
  },
  CH: {
    code: "CH", name: "Switzerland", maturity: "ALTA", mandateLevel: "MODERADO",
    regulatoryFramework: "FINMA guidelines", notes: "Alinhado com PSD2",
  },

  // ── MÉDIA MATURIDADE 3DS ─────────────────────────────────────────────────
  AE: {
    code: "AE", name: "United Arab Emirates", maturity: "MEDIA", mandateLevel: "MODERADO",
    regulatoryFramework: "CBUAE guidelines", notes: "Adoção crescente",
  },
  AR: {
    code: "AR", name: "Argentina", maturity: "MEDIA", mandateLevel: "OPCIONAL",
    regulatoryFramework: "BCRA circular", notes: "Adoção variável por emissor",
  },
  CL: {
    code: "CL", name: "Chile", maturity: "MEDIA", mandateLevel: "OPCIONAL",
    regulatoryFramework: "SBIF/CMF normas", notes: "Adoção crescente",
  },
  CO: {
    code: "CO", name: "Colombia", maturity: "MEDIA", mandateLevel: "OPCIONAL",
    regulatoryFramework: "SFC circular", notes: "Adoção variável",
  },
  MX: {
    code: "MX", name: "Mexico", maturity: "MEDIA", mandateLevel: "OPCIONAL",
    regulatoryFramework: "CNBV disposiciones", notes: "Crescimento acelerado de adoção",
  },
  PE: {
    code: "PE", name: "Peru", maturity: "MEDIA", mandateLevel: "OPCIONAL",
    regulatoryFramework: "SBS normas", notes: "Adoção parcial",
  },
  PL: {
    code: "PL", name: "Poland", maturity: "MEDIA", mandateLevel: "FORTE",
    regulatoryFramework: "PSD2/SCA", notes: "EU member, implementação em progresso",
  },
  US: {
    code: "US", name: "United States", maturity: "MEDIA", mandateLevel: "OPCIONAL",
    regulatoryFramework: "EMVCo / card network programs", notes: "Sem mandato federal; adoção por rede/emissor",
  },
  ZA: {
    code: "ZA", name: "South Africa", maturity: "MEDIA", mandateLevel: "OPCIONAL",
    regulatoryFramework: "SARB guidelines", notes: "Adoção por grandes bancos",
  },

  // ── BAIXA / VARIÁVEL 3DS ─────────────────────────────────────────────────
  BD: {
    code: "BD", name: "Bangladesh", maturity: "BAIXA", mandateLevel: "BAIXO",
    regulatoryFramework: "Bangladesh Bank circular", notes: "Infraestrutura limitada",
  },
  BG: {
    code: "BG", name: "Bulgaria", maturity: "VARIAVEL", mandateLevel: "MODERADO",
    regulatoryFramework: "PSD2/SCA (EU)", notes: "EU member, implementação inconsistente",
  },
  GH: {
    code: "GH", name: "Ghana", maturity: "BAIXA", mandateLevel: "BAIXO",
    regulatoryFramework: "BOG guidelines", notes: "Adoção muito limitada",
  },
  ID: {
    code: "ID", name: "Indonesia", maturity: "VARIAVEL", mandateLevel: "BAIXO",
    regulatoryFramework: "OJK regulations", notes: "Variável por emissor",
  },
  KE: {
    code: "KE", name: "Kenya", maturity: "BAIXA", mandateLevel: "BAIXO",
    regulatoryFramework: "CBK guidelines", notes: "Foco em mobile money, não 3DS",
  },
  MY: {
    code: "MY", name: "Malaysia", maturity: "VARIAVEL", mandateLevel: "OPCIONAL",
    regulatoryFramework: "BNM guidelines", notes: "Crescente mas variável",
  },
  NG: {
    code: "NG", name: "Nigeria", maturity: "BAIXA", mandateLevel: "BAIXO",
    regulatoryFramework: "CBN directives", notes: "Alta taxa de fraude, 3DS limitado",
  },
  PH: {
    code: "PH", name: "Philippines", maturity: "VARIAVEL", mandateLevel: "BAIXO",
    regulatoryFramework: "BSP guidelines", notes: "Adoção crescente mas inconsistente",
  },
  PK: {
    code: "PK", name: "Pakistan", maturity: "BAIXA", mandateLevel: "BAIXO",
    regulatoryFramework: "SBP regulations", notes: "Infraestrutura limitada",
  },
  PY: {
    code: "PY", name: "Paraguay", maturity: "BAIXA", mandateLevel: "BAIXO",
    regulatoryFramework: "BCP normas", notes: "Adoção muito limitada",
  },
  RO: {
    code: "RO", name: "Romania", maturity: "VARIAVEL", mandateLevel: "MODERADO",
    regulatoryFramework: "PSD2/SCA (EU)", notes: "EU member, implementação inconsistente",
  },
  VE: {
    code: "VE", name: "Venezuela", maturity: "BAIXA", mandateLevel: "BAIXO",
    regulatoryFramework: "BCV normas", notes: "Instabilidade econômica afeta infraestrutura",
  },
  VN: {
    code: "VN", name: "Vietnam", maturity: "VARIAVEL", mandateLevel: "BAIXO",
    regulatoryFramework: "SBV regulations", notes: "Adoção variável e crescente",
  },
}

// Default for unknown countries
export const DEFAULT_MATURITY_CONFIG: CountryMaturityConfig = {
  code: "XX",
  name: "Desconhecido",
  maturity: "DESCONHECIDA",
  mandateLevel: "DESCONHECIDO",
  regulatoryFramework: "Desconhecido",
  notes: "País não identificado na base de dados de maturidade",
}

export function getCountryMaturity(countryCode: string): CountryMaturityConfig {
  if (!countryCode) return DEFAULT_MATURITY_CONFIG
  return COUNTRY_MATURITY_REGISTRY[countryCode.toUpperCase()] ?? DEFAULT_MATURITY_CONFIG
}

export function getMaturityLevel(countryCode: string): ThreeDSMaturityLevel {
  return getCountryMaturity(countryCode).maturity
}
