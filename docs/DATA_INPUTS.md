# Data Inputs — Contexto avançado da transação

## Campos

- **Moeda** (`CurrencySelect`)
  - fonte: `lib/data/iso-4217.ts`
  - combobox com busca por código/nome
  - top moedas de e-commerce no topo
- **País do merchant** (`CountrySelect`)
  - fonte: `lib/data/iso-3166.ts`
  - busca por sigla/nome PT-BR e exibição com bandeira
- **MCC** (`MccSelect`)
  - fonte: `lib/data/mcc-codes.ts`
  - busca por código e palavra-chave
  - sinalização de alto risco para MCCs sensíveis

## Regras de autopreenchimento

Após retorno de BIN (Neutrino/Mastercard), o app sugere automaticamente:

- moeda do emissor para campo **Moeda**;
- país emissor para **País do merchant** (hipótese doméstica inicial).

O usuário pode sobrescrever em qualquer momento.

## Comportamento de UX

- sem dado de BIN, campos permanecem vazios com placeholder explicativo;
- diferenças de país mostram **Doméstica ✅** vs **Internacional ⚠️ (cross-border)**;
- MCC alto risco mostra aviso amarelo no formulário.
