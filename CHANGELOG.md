# Changelog

## 2026-05-09

- v3.2.1: política de exibição de score em `lib/scoring/displayPolicy.ts` (exact/range/qualitative/hidden) alinhada à confiança de fontes.
- Formulário de contexto avançado migrado para combobox com busca (`CurrencySelect`, `CountrySelect`, `MccSelect`) com datasets versionados em `lib/data/`.
- Autopreenchimento por BIN: moeda e país sugeridos automaticamente com possibilidade de sobrescrita.
- Banner sticky de degradação quando fontes estão parciais, com modal de status técnico por fonte e ação de retry/report.
- Cards de score agora exibem transparência metodológica com botão “Como calculamos isto?” + seção “Sobre este BIN”.

## 2026-05-08

### Breaking changes

- Consolidado SSOT de análise: `app/api/bin-analysis` agora usa o motor canônico `lib/premium-3-0` (`runFullBinAnalysis`), removendo dependência de `src/lib/intelligence`.
- Removidos módulos legados duplicados: `lib/premium-3-0/riskEngine.ts`, `lib/premium-3-0/binIntelligence.ts`, `lib/premium-3-0/threeDSEngine.ts` e diretório `src/lib/intelligence/`.
- Pipeline de pacotes padronizado em pnpm: removido `package-lock.json`; `package.json` agora declara `"packageManager": "pnpm@9.15.0"`; CI alinhada para pnpm 9.15.0 com `--frozen-lockfile` para manter consistência com Vercel/frozen lockfile.
- Regeneração do lockfile sincronizou o specifier de `@supabase/supabase-js` para `^2.105.3` conforme `package.json` (sem mudança adicional manual de dependência).

## 2026-05-06

- Adicionado modo de linguagem da análise de BIN (Analista / Comerciante / Ambos) com persistência em `localStorage` (`verifibin:analysisMode`).
- Nova camada de UX no painel Avançado com resumo executivo, semáforo, barra de risco segmentada e explicação dinâmica "Por que essa nota?".
- Inclusão de glossário técnico-popular centralizado para tradução de termos e tooltips explicativos.
