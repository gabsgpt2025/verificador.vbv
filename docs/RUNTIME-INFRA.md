# Runtime Infra — Cache, Circuit Breaker, Retry

A Fase 5 introduz uma camada de resiliência reutilizável para providers externos em `lib/premium-3-0/runtime/`.

## Componentes

- `cache/`: store pluggable com fallback seguro para memória.
- `circuitBreaker.ts`: proteção contra cascata de falhas do upstream.
- `retry.ts`: retry idempotente com backoff exponencial.
- `resilientFetch.ts`: helper único que combina cache + breaker + retry + parse.
- `metrics.ts`: métricas in-memory por provider/operação.

## Quando usar cache

Use cache quando a resposta muda pouco e chamadas repetidas consomem quota sem agregar valor.

Exemplos:

- **Com cache longo**: `bin-lookup`, metadata de emissor, dados de país/brand.
- **Com cache curto**: reputação de IP, heurísticas de device, scores quase em tempo real.
- **Sem cache**: operações sensíveis a estado imediato, ações de escrita, validações one-time.

Regra prática:

- `cacheTtlSeconds = 0` → desabilita cache.
- Dados estáveis por dias → TTL de horas/dias.
- Dados voláteis por minuto → TTL de segundos/minutos.

## Como configurar um provider novo

1. Escolha `providerName` e `operation` estáveis.
2. Defina um `cacheKey` determinístico.
3. Ajuste `breakerOptions` para o SLA do upstream.
4. Ajuste `retryOptions` apenas para chamadas idempotentes.
5. Faça `parse(raw)` validar a resposta antes de cachear.

### Exemplo

```ts
import { z } from "zod"
import { resilientFetch } from "@/lib/premium-3-0/runtime/resilientFetch"

const schema = z.object({ valid: z.boolean().optional() }).passthrough()

const result = await resilientFetch(
  () => fetch("https://provider.example/lookup").then((response) => response.json()),
  {
    providerName: "neutrino",
    operation: "ip-probe",
    cacheKey: `neutrino:ip-probe:${ip}`,
    cacheTtlSeconds: 300,
    breakerOptions: {
      name: "neutrino:ip-probe",
      failureThreshold: 5,
      timeoutMs: 4000,
      resetTimeoutMs: 30000,
    },
    retryOptions: {
      maxAttempts: 2,
    },
    parse: (raw) => schema.parse(raw),
  },
)
```

## Preview da Fase 5N (Neutrino Suite)

Para cada endpoint novo da Neutrino:

- reutilize `resilientFetch()`;
- mantenha nomes consistentes (`neutrino:<operation>`);
- prefira cache para consultas de lookup/enrichment;
- desabilite retry em operações não idempotentes;
- acompanhe o endpoint `/api/admin/runtime-metrics` para hit rate, latência e abertura de circuit breaker.

## Upstash

A implementação default é `memoryCache`, sempre disponível e sem dependência nova.

Ative Upstash apenas quando:

- houver múltiplas instâncias do app;
- o cache precisar sobreviver a restart/deploy;
- a Fase 5N/11 aumentar o volume a ponto de exigir cache distribuído.

Quando isso acontecer:

1. instalar `@upstash/redis`;
2. preencher `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`;
3. validar o hit rate no endpoint admin antes de expandir TTLs.
