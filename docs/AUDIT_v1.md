# AUDIT_v1 — VeriFiBIN Base Analysis

## Onde está a página principal da ferramenta?
`app/dashboard/bin-pro/page.tsx` e `app/dashboard/page.tsx` (verificação básica)

## Onde está a chamada da API de BIN?
`app/api/bin-analysis/route.ts` — função `simulateBINLookup()` (dados SIMULADOS, sem API real integrada)
`app/api/bin/verify/route.ts` — verificação básica também com dados simulados

## Qual API está integrada?
NENHUMA API real de BIN está integrada. Os dados são gerados por simulação (`simulateBINLookup`). A integração com Neutrino, FraudLabs, Binlist ou outra API real **não existe ainda** na base.

## Onde o resultado da API é normalizado?
Não existe normalização. A função `simulateBINLookup()` retorna dados diretamente sem validação ou normalização de campos.

## Onde o score atual é calculado?
`lib/bin-analysis/ml-scoring.ts` — classe `MLRiskScoring.calculateRiskScore()`. Usa pesos fixos com dados randômicos (`Math.random()`) para fatores como `historicalFraud` e `velocityRisk`, tornando o score não determinístico e não auditável.

## Quais componentes exibem os cards de resultado?
`components/bin-pro/bin-analysis-cards.tsx` — 8 cards fixos
`components/bin-pro/bin-pro-interface.tsx` — card de overview

## Existe armazenamento de consultas?
Sim, em `bin_verifications` (via Supabase), mas sem estrutura de logs de análise ou overrides.

## Existe dado hardcoded?
Sim: lista de países de alto risco em `ml-scoring.ts`, lista de bancos confiáveis, BINs de alto risco. Nenhum dado vem de API real.

## Existe afirmação absoluta sobre 3DS/VBV sem fonte?
**SIM — PROBLEMA CRÍTICO.** O campo `threeDSStatus` pode retornar `"ENABLED"` sem nenhuma fonte confiável. O prompt da IA diz literalmente `"threeDSStatus": "ENABLED/DISABLED/PARTIAL"` sem diferenciar dado real de inferência.

## Existe risco de armazenar PAN completo?
Não foram encontrados campos de PAN no código. O sistema trabalha apenas com BIN (6-8 dígitos). Sem risco imediato de exposição de PAN.

## Existe mascaramento correto?
Não aplicável na base atual — apenas BIN é processado.

## Existe separação entre "dado real da API" e "dado inferido"?
**NÃO.** Todo dado é tratado como equivalente, sem distinção entre dado real da API e inferência interna.

## Problemas Encontrados

### Críticos
1. `bypassProbability` — campo que indica probabilidade de "bypass" de autenticação. Linguagem inadequada para sistema antifraude profissional.
2. Score não determinístico — usa `Math.random()` em fatores de risco.
3. Sem API real de BIN integrada — todos os dados são simulados.
4. `threeDSStatus: "ENABLED"` retornado como fato sem fonte.

### Importantes
5. Sem separação visual/técnica entre dados reais e inferidos.
6. Sem tabela de maturidade 3DS por país.
7. Sem histórico de análises (apenas verificações básicas).
8. Sem sistema de overrides para correção manual.
9. Sem qualidade de dados quantificada.
10. Sem compliance por região.

### Menores
11. `lib/bin-analysis/advanced-ml-scoring.ts` usa `Math.random()` em `velocityRisk` e `deviceFingerprint`.
12. Prompt da IA pede `bypassProbability` — linguagem inapropriada.

## Diagnóstico Geral
A ferramenta atual é um MVP funcional mas com arquitetura de prova de conceito. O score não é auditável, a linguagem não é adequada para compliance/antifraude, e não há distinção entre dados reais e inferências. A versão 2.0 resolve todos esses pontos com módulos separados, linguagem profissional e score explicável.
