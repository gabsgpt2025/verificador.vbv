# ANTIFRAUDE-SESSION — Contrato SessionRiskResponse

> **Fase 5** — Análise antifraude automática do visitante (sessão/dispositivo/rede).
> Motor SSOT: `lib/premium-3-0/sessionRisk.ts`.
> Endpoint: `POST /api/antifraud-session`.
> Página: `GET /antifraude`.

---

## Contrato: `SessionRiskResponse`

```typescript
export interface SessionRiskResponse {
  ip: string | null           // IP real — NUNCA exposto ao cliente (só no servidor)
  ipMasked: string            // IP mascarado para exibição (ex: "201.x.x.42")
  geo: {
    country: string | null    // Código do país (ex: "BR")
    city: string | null       // Cidade (ex: "São Paulo")
    isp: string | null        // Provedor de Internet
    asn: string | null        // Autonomous System Number
    hostname: string | null   // Hostname reverso do IP
  }
  network: {
    isTor: boolean            // Nó TOR detectado
    isProxy: boolean          // Proxy público detectado
    isVpn: boolean            // VPN detectada
    isHijacked: boolean       // IP em faixa sequestrada (BGP hijack)
    isSpider: boolean         // Spider/crawler
    isMalware: boolean        // IP associado a malware/phishing
    isBot: boolean            // IP classificado como bot (reputação de rede)
    isListed: boolean         // Consta em pelo menos 1 blocklist
    blocklistCount: number    // Número de blocklists onde o IP aparece
  }
  device: {
    browser: string | null
    browserVersion: string | null
    os: string | null
    osVersion: string | null
    deviceType: "MOBILE" | "DESKTOP" | "TABLET" | "BOT" | "UNKNOWN"
    isMobile: boolean
    isBot: boolean            // UA classificado como bot pelo UA Lookup
  }
  hostReputation: {
    score: number | null      // Score de reputação Neutrino (0–1); null = não consultado
    listed: boolean           // Hostname em lista negativa
    categories: string[]      // Categorias da lista (ex: ["phishing", "malware"])
  } | null                    // null quando hostname indisponível ou flag OFF
  client: {
    fingerprint: string | null   // Hash SHA-256 determinístico (client-side, sem libs)
    timezone: string | null      // ex: "America/Sao_Paulo"
    languages: string[]          // ex: ["pt-BR", "en"]
    screen: { w: number; h: number; colorDepth: number } | null
  }
  riskScore: number              // Score final 0–100
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  recommendation: "ALLOW" | "REVIEW" | "CHALLENGE" | "BLOCK"
  factors: Array<{
    label: string
    impact: number             // Impacto positivo (aumento de risco) ou negativo (redução)
    reason: string             // Explicação em linguagem natural
  }>
  sourcesUsed: string[]        // ex: ["neutrino:ip-info", "neutrino:ip-blocklist"]
  generatedAt: string          // ISO 8601
}
```

---

## Enrichments Neutrino utilizados

| Enrichment | Feature Flag | Dados fornecidos | Cache TTL |
|---|---|---|---|
| **IP Info** | `NEUTRINO_IP_INFO_ENABLED` | país, cidade, ISP, is_vpn, is_proxy, is_tor | 60 min |
| **IP Blocklist** | `NEUTRINO_IP_BLOCKLIST_ENABLED` | is_listed, list_count, is_hijacked, is_malware, is_bot, is_spider | 30 min |
| **UA Lookup** | `NEUTRINO_UA_LOOKUP_ENABLED` | browser, browser_version, os, os_version, is_mobile, is_bot, type | 24 h |
| **Host Reputation** | `NEUTRINO_HOST_REPUTATION_ENABLED` | reputation_score, is_listed, lists (categorias) | 60 min |

**Fallback:** quando uma flag está OFF ou o serviço falha, o campo correspondente fica `null` ou `false` (jamais inventa dados). Se nenhum enrichment estiver disponível, o engine usa o parser local de User-Agent (`lib/premium-3-0/enrichment/deviceEnrichment.ts`).

---

## Derivação do score (0–100)

### Score base: **20**

| Sinal | Impacto |
|---|---|
| isTor = true | +30 |
| isVpn = true | +20 |
| isProxy = true | +15 |
| isHijacked = true | +25 |
| isMalware = true | +25 |
| isBot (rede) = true | +20 |
| isSpider = true | +10 |
| isListed = true | +5 |
| blocklistCount × 3 (máx +15) | +0..+15 |
| device.isBot = true | +25 |
| deviceType = UNKNOWN | +10 |
| device.isMobile = true | −5 |
| hostReputation.listed = true | +10 |

### Limiar de riskLevel e recommendation

| Score | riskLevel | recommendation |
|---|---|---|
| 0–25 | LOW | ALLOW |
| 26–50 | MEDIUM | REVIEW |
| 51–75 | HIGH | CHALLENGE |
| 76–100 | CRITICAL | BLOCK |

### Casos de teste de referência (Vitest `tests/antifraud/sessionRisk.test.ts`)

| Cenário | Score esperado | Recomendação |
|---|---|---|
| VPN + TOR + bot (UA) | ≥ 85 | BLOCK |
| Mobile residencial BR, sem flags | ≤ 25 | ALLOW |
| VPN sozinho | 40–60 | REVIEW |

---

## Segurança

- **IP mascarado**: o campo `ip` (IP real) é removido da resposta antes de serializar ao cliente — apenas `ipMasked` é enviado (ex: `"201.x.x.42"`).
- **Sem `Math.random()`**: todos os valores são determinísticos ou derivados de dados reais.
- **Sem libs externas** para fingerprint: usa exclusivamente `crypto.subtle.digest` nativo do browser.
- **Circuit breaker + cache + retry** do `lib/premium-3-0/runtime/` são reusados para todas as chamadas Neutrino.

---

## TODO (Fase 6)

- Rate limiting por IP no endpoint `/api/antifraud-session`.
- Persistência das sessões em Supabase (`session_risk_logs`).
- WebRTC IP leak detection.
- Integração com IP Probe (mais detalhes de VPN/datacenter).
- Integração na página de checkout/pagamento.
