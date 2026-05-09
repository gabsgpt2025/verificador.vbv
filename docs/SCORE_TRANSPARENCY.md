# Score Transparency (v3.2.1)

## Política de exibição (`lib/scoring/displayPolicy.ts`)

Entrada:

```ts
{ score, confidence, sourcesConfirmed, sourcesTotal }
```

Saída:

```ts
{ displayValue, precision, warning? }
```

### Regras

- `high` → `exact` (ex.: `49/100`)
- `medium` → `range` (ex.: `40–55 / 100`) + aviso de estimativa
- `low` → `qualitative` (ex.: `Risco médio — análise parcial`) + ocultação de precisão de subcards
- `unavailable` → `hidden` (score indisponível + ação de retry)

## Fórmula simplificada do score geral

`Score = 0.3*BIN + 0.2*Geo + 0.15*Comportamental + 0.1*Temporal + 0.15*Dispositivo + 0.1*Gateway`

## Transparência na UI

Cada card possui botão **“Como calculamos isto?”** com:

- fórmula simplificada;
- tabela de contribuições;
- fontes e telemetria (status, latência, HTTP);
- versão do ruleset (`engine v3.2.0 / ruleset v12`);
- link para `/metodologia`.
