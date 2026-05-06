# VeriFiBIN 2.0

**Plataforma Profissional de Análise Antifraude e Inteligência de Risco de BIN**

---

## Posicionamento

VeriFiBIN 2.0 é uma ferramenta de **análise antifraude, compliance e inteligência de risco de cartões de pagamento**. Não é uma ferramenta para burlar pagamentos, garantir aprovação ou facilitar fraude.

**Objetivo**: classificar o risco de transações com base em dados do BIN, inferir a probabilidade de autenticação 3DS/VBV, e fornecer recomendações de prevenção a fraude com linguagem técnica e transparente.

---


## Novidades de UX (VeriFiBIN 2.0)

- Toggle de linguagem no resultado da análise: **Analista / Comerciante / Ambos** com persistência em `localStorage` (`verifibin:analysisMode`).
- Resumo executivo para leitura popular com semáforo de risco, ações práticas e narrativa explicável.
- Glossário técnico-popular centralizado em `lib/analysis/glossary.ts` para tradução consistente de termos críticos.

---

## Arquitetura — Camada de Inteligência (`src/lib/intelligence/`)

| Módulo | Arquivo | Responsabilidade |
|---|---|---|
| Tipos TypeScript | `types.ts` | Modelo de dados tipado com 6 módulos |
| Maturidade 3DS por País | `countryMaturity.ts` | Tabela configurável de maturidade 3DS mundial |
| Analisador 3DS/VBV | `threeDSAnalyzer.ts` | Inferência probabilística de suporte a 3DS |
| Motor de Score | `riskEngine.ts` | Score explicável com pipeline de regras puras |
| Compliance | `complianceModule.ts` | Mapeamento regulatório por país/região |
| Qualidade dos Dados | `dataQuality.ts` | Avaliação de completude e consistência da API |
| Recomendações | `recommendationModule.ts` | Geração de recomendações antifraude profissionais |
| Orquestrador | `binAnalyzer.ts` | Coordena todos os módulos e produz o JSON padrão |

---

## Modelo de Resultado (JSON Padrão)

```json
{
  "bin": "405708",
  "analysisType": "advanced",
  "source": { "provider": "BINList", "rawDataAvailable": true, "apiConfidence": "alta" },
  "technicalData": {
    "brand": "VISA", "cardType": "CREDIT", "cardCategory": "CLASSIC",
    "country": "United States", "countryCode": "US", "currency": "USD",
    "issuer": null, "isCommercial": false, "isPrepaid": false,
    "realApiFields": ["brand", "cardType", "country", ...],
    "inferredFields": ["threeDSAnalysis", "riskAnalysis", ...]
  },
  "threeDSAnalysis": {
    "status": "ATIVO_PROVAVEL", "confidence": "ALTA",
    "vbvLikely": true, "challengeLikelihood": "MEDIA",
    "protocolLikely": "EMV_3DS_2",
    "isInferred": true,
    "technicalExplanation": "Status inferido algoritmicamente. APIs de BIN não confirmam 3DS diretamente."
  },
  "riskAnalysis": {
    "score": 50, "level": "MEDIO", "recommendation": "REVISAR",
    "riskBreakdown": [
      { "factor": "País com maturidade 3DS média", "impact": "+10", "numericImpact": 10 },
      { "factor": "Emissor não identificado pela API", "impact": "+15", "numericImpact": 15 }
    ]
  },
  "complianceData": {
    "regulatoryRegion": "Estados Unidos",
    "threeDSMandateLevel": "OPCIONAL",
    "liabilityShiftExpected": false
  },
  "dataQuality": {
    "score": 70, "missingFields": ["issuer"],
    "realApiFields": ["brand", "cardType", "country", "isPrepaid", "isCommercial"],
    "inferredFields": ["threeDSAnalysis", "challengeLikelihood", "riskAnalysis"]
  },
  "finalSummary": {
    "title": "Cartão com suporte 3DS provavelmente ativo",
    "action": "Revisar ou exigir autenticação 3DS em transações sensíveis.",
    "recommendedActions": ["Revisar manualmente ou aplicar autenticação adicional"]
  }
}
```

---

## Módulos de Análise

### 1. Dados Técnicos (Real da API)
Todos os campos vindos diretamente da API são marcados em `realApiFields`. Campos `null` indicam ausência de dado na resposta da API.

### 2. Diagnóstico 3DS/VBV (Inferido)
**IMPORTANTE**: APIs de BIN **não confirmam** 3DS/VBV diretamente. Todo status 3DS é uma inferência baseada em:
- País de emissão (maturidade regulatória)
- Bandeira (Visa/MC/Amex/Elo/Hipercard)
- Tipo (crédito/débito/pré-pago/corporativo)
- Categoria/nível (Classic/Gold/Platinum/Black/Infinite)
- Emissor identificado

O campo `isInferred: true` sempre presente indica que o status **não é confirmado por fonte primária**.

### 3. Score de Risco (0–100, Explicável)
Score baseado em pipeline de regras puras e testáveis. Cada fator é retornado com impacto numérico positivo (aumenta risco) ou negativo (reduz risco).

| Faixa | Classificação |
|---|---|
| 0–30 | BAIXO |
| 31–60 | MEDIO |
| 61–80 | ALTO |
| 81–100 | CRITICO |

### 4. Compliance
Mapeamento de framework regulatório por país:
- EU/UK: PSD2/SCA FORTE (obrigatório)
- Índia: RBI OBRIGATÓRIO
- Brasil: MODERADO (alta adoção)
- EUA: OPCIONAL (sem mandato federal)
- Países com baixa maturidade: BAIXO/DESCONHECIDO

### 5. Qualidade dos Dados
Avalia completude e consistência dos dados retornados pela API. Score 0–100.

### 6. Recomendação
Recomendações disponíveis:
- `APROVAR_COM_SEGURANCA` — risco baixo, dados completos
- `REVISAR` — revisar manualmente, dados parciais ou risco médio
- `EXIGIR_3DS` — exigir autenticação 3DS antes de aprovar
- `BLOQUEAR_PREVENTIVAMENTE` — risco crítico
- `DADOS_INSUFICIENTES` — dados insuficientes para decisão

---

## Banco de Inteligência (PostgreSQL/Supabase)

Migration: `scripts/008_bin_intelligence_tables.sql`

- **`bin_analysis_logs`**: histórico de análises com campos para revisão manual por analistas
- **`bin_intelligence_overrides`**: correções manuais de analistas que melhoram análises futuras

---

## Testes

```bash
npm test
```

64 testes cobrindo 10 cenários:
1. BIN crédito Visa EUA sem emissor
2. BIN débito Mastercard EUA com emissor conhecido
3. BIN crédito Brasil banco conhecido (Bradesco)
4. BIN pré-paga internacional (México)
5. BIN comercial/business
6. BIN com país desconhecido
7. BIN com dados muito incompletos
8. BIN país com 3DS obrigatório (Índia/RBI)
9. BIN país com 3DS fraco (Nigéria)
10. BIN banco regional (Elo/CEF Brasil)
11. Validação de linguagem — nenhum termo proibido nas respostas

---

## Linguagem Profissional

Esta plataforma usa exclusivamente linguagem de compliance e prevenção de fraude:

| Evitar | Usar |
|---|---|
| "Essa BIN passa" | "Probabilidade estimada de 3DS ativo" |
| "Bypassa" | "Status 3DS inferido" |
| "Aprovação garantida" | "Dados indicam baixo risco" |
| "Sem risco" | "Revisão recomendada" |
| "3DS ativo" (certeza) | "3DS provavelmente ativo (inferido)" |
