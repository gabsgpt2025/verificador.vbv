# Confidence System

## Níveis

- 🟢 **Verificado**: dado de fonte oficial com `source` real.
- 🔵 **Calculado**: resultado determinístico sobre dados verificados.
- 🟡 **Estimado**: heurística sobre dados parciais (mostrar margem).
- ⚪ **Indisponível**: sem dado; não deve pontuar.

## Elegibilidade

- `Verificado` só é válido com `source` preenchido.
- Se `Verificado` vier sem `source`, o sistema rebaixa para `Indisponível`.
- Compliance não pode aparecer como `✅ Verificado` sem `evidenceUrl` ou `verifiedBy`.

## Implementação

- Componente: `components/ui/ConfidenceBadge.tsx`
- Regras automáticas:
  - `resolveConfidenceBadge(...)`
  - `resolveComplianceStatus(...)`
