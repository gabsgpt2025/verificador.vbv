# AUDIT v1 — VeriFiBIN Diagnóstico da Base Atual

## 1. Onde é feita a consulta da BIN

Há dois endpoints que realizam consultas de BIN:

- **`app/api/bin-analysis/route.ts`** — endpoint principal do "BIN Pro 2.0". Usa a função local `simulateBINLookup()` que **não chama API real**; retorna dados pseudoaleatórios com base no hash do BIN. Integra `@ai-sdk/xai` (Grok-4) para gerar uma análise textual.
- **`app/api/bin/verify/route.ts`** — endpoint de verificação básica. Também usa funções locais (`getBrandFromBin`, `getIssuerFromBin`) com dados hardcoded/aleatórios; sem chamada a API externa real.

**Conclusão**: nenhuma consulta real a API externa (Neutrino, BinList, etc.) está integrada. Todo dado de BIN é simulado/fictício.

---

## 2. APIs Externas Integradas

| Integração | Descrição |
|---|---|
| `@ai-sdk/xai` (Grok-4) | Usada em `app/api/bin-analysis/route.ts` para gerar texto de análise via LLM |
| Supabase | Autenticação, banco de dados (Postgres), armazenamento de histórico |

**Nenhuma API de lookup de BIN está integrada** (ex: Neutrino, BinList, FraudLabs Pro, BINCheck). Todos os dados de bandeira, tipo, país e emissor são mock/simulados.

---

## 3. Onde os Dados são Normalizados

Não há camada formal de normalização. Os dados são produzidos diretamente pelas funções mock:

- `simulateBINLookup()` em `app/api/bin-analysis/route.ts` — retorna `brand`, `type`, `level`, `bank`, `country`, `currency` com valores aleatórios.
- `getBrandFromBin()` e `getIssuerFromBin()` em `app/api/bin/verify/route.ts` — lógica de prefixo simples + array estático de bancos.

---

## 4. Onde o Score é Calculado

- **`lib/bin-analysis/ml-scoring.ts`** — `MLRiskScoring.calculateRiskScore()`: combina 5 fatores ponderados (`geographicRisk`, `bankReputation`, `cardTypeRisk`, `historicalFraud`, `velocityRisk`). `historicalFraud` usa `Math.random()`, `velocityRisk` usa `Math.random()` — scores não são determinísticos.
- **`lib/bin-analysis/advanced-ml-scoring.ts`** — `AdvancedMLScoring.calculateAdvancedRiskScore()`: expande para 10 fatores, mas 5 deles ainda usam `Math.random()` (velocidade, device, comportamento, rede, tempo).
- O score gerado pelo LLM (Grok-4) inclui `bypassProbability` — terminologia inadequada (ver seção 7).

---

## 5. Componentes de UI que Exibem o Resultado

| Componente | Descrição |
|---|---|
| `components/bin-pro/bin-pro-interface.tsx` | Input do BIN, botão de análise, exibição do overview de risco |
| `components/bin-pro/bin-analysis-cards.tsx` | 8 cards: Card Info, Geographic, Security, AI Insights, Currency, Fraud Indicators, Risk Scoring, Recommendations |
| `components/bin-pro/bin-pro-history.tsx` | Histórico de análises do usuário |
| `components/bin-pro/bin-pro-glossary.tsx` | Glossário de termos |
| `components/bin-pro/ml-scoring-dashboard.tsx` | Dashboard de métricas do modelo |
| `components/bin-pro/currency-converter-widget.tsx` | Conversor de moedas |

---

## 6. Problemas de Arquitetura

### 6.1 Dados Completamente Fictícios
Todos os dados retornados são simulados. Sem integração com API real de BIN, o sistema não tem valor analítico real.

### 6.2 Não-Determinismo nos Scores
`Math.random()` é usado em `historicalFraud` e `velocityRisk` — o mesmo BIN recebe scores diferentes a cada consulta.

### 6.3 Duplicação de Lógica
Há dois endpoints fazendo a mesma coisa (`/api/bin-analysis` e `/api/bin/verify`) com lógicas diferentes e sem compartilhamento de código.

### 6.4 Sem Separação de "Dado Real" vs "Inferido"
O sistema não distingue entre dados vindos de API e inferências do algoritmo. Tudo é tratado como verdade.

### 6.5 Ausência de Modelo de Dados Estruturado
Não há um modelo de resultado padronizado com módulos (técnico, 3DS, risco, compliance, qualidade).

### 6.6 Ausência de Tabela de Países
Maturidade 3DS por país está hardcoded em arrays dispersos sem configuração centralizada.

---

## 7. Pontos onde o Sistema Afirma como Verdade Absoluta sem Fonte

- `bypassProbability` em `BINAnalysisResult.analysis` — implicação de que fraude pode ser calculada como probabilidade de sucesso. Terminologia inadequada e enganosa.
- `threeDSStatus: "ENABLED/DISABLED/PARTIAL"` — retornado pelo LLM sem fonte real. O LLM não tem acesso a dados reais de 3DS.
- `vbvStatus: "ENABLED/DISABLED"` — mesma situação, sem confirmação de fonte confiável.
- O prompt enviado ao Grok-4 pede explicitamente `bypassProbability` — instrução inadequada para um sistema antifraude.
- A resposta mock de fallback do LLM usa `bypassProbability: Math.min(riskScore + 10, 95)` — valor completamente fictício apresentado como dado real.

---

## 8. Falhas de UX, Mensagens Confusas e Campos Ausentes

### Campos Ausentes
- `issuerWebsite`, `issuerPhone` — presentes no tipo `BinVerificationResult` mas ausentes em `BINAnalysisResult`
- `isPrepaid`, `isCommercial` — não exibidos na UI
- `countryCode` — ausente
- `currency` do cartão vs moeda de conversão — misturados sem distinção

### Mensagens Confusas / Problemáticas
- "Bypass Probability" — linguagem de fraude
- "Security Analysis" com "Bypass Probability: X%" — frame inadequado
- Sem indicação visual de "dado real" vs "inferido"
- Sem indicação de qual fonte (API, algoritmo, LLM) originou cada campo

### Ausência de Compliance
- Nenhuma menção a regulação (PSD2, SCA, RBI, etc.)
- Sem aviso de que 3DS não é confirmado pela API

### UX Geral
- Sem separação de análise básica vs avançada
- Sem score explicável (breakdown dos fatores)
- Sem ações recomendadas específicas por cenário

---

## Resumo dos Pontos Críticos

| Prioridade | Problema |
|---|---|
| 🔴 CRÍTICO | Terminologia "bypass" e "bypassProbability" — deve ser removida |
| 🔴 CRÍTICO | 3DS status afirmado como certeza sem fonte real |
| 🔴 CRÍTICO | Nenhuma API real de BIN integrada |
| 🟠 ALTO | `Math.random()` em scoring — não determinístico |
| 🟠 ALTO | Sem separação dado real vs inferido |
| 🟠 ALTO | Sem compliance / regulação |
| 🟡 MÉDIO | Dois endpoints duplicados sem arquitetura comum |
| 🟡 MÉDIO | Sem tabela de maturidade 3DS por país |
| 🟡 MÉDIO | UI sem badges visual de fonte dos dados |
