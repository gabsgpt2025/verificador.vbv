# CI obrigatório com branch protection (`validate`)

## Por quê

O objetivo é impedir novo merge de PR com falha de validação, como no incidente do erro de tipo `merchantCategoryCode`, que quebrou o deploy.  
Com branch protection, o merge só acontece quando o check `validate` (workflow de CI) estiver verde.

## Pré-requisito

Antes de configurar a regra, o workflow `.github/workflows/ci.yml` precisa ter rodado ao menos uma vez com sucesso.  
Após o ajuste do commit `51dbb0f` (ordem correta de setup de `pnpm`/Node), o status check `validate` passa a aparecer na lista de checks selecionáveis no GitHub.

## Passo a passo (UI) para `main`

1. Acesse **Settings** → **Branches**.
2. Clique em **Add branch ruleset** (ou **Add classic branch protection rule**).
3. Defina o **Branch name pattern** como `main`.
4. Ative as opções:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Require review from Code Owners
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Status check obrigatório: `validate`
   - ✅ Require conversation resolution before merging
   - ✅ Do not allow bypassing the above settings
5. Salve a regra.

## Passo a passo (UI) para `v0/**`

Repita o processo criando uma regra com **Branch name pattern** igual a `v0/**`.  
Uma única regra cobre todas as branches desse prefixo.

## Alternativa via GitHub CLI (`gh api`)

Para branch **`main`** (proteção classic), use:

```bash
gh api -X PUT \
  "repos/gabsgpt2025/verificador.vbv/branches/main/protection" \
  -F required_status_checks.strict=true \
  -F 'required_status_checks.contexts[]=validate' \
  -F enforce_admins=true \
  -F required_pull_request_reviews.required_approving_review_count=1 \
  -F required_pull_request_reviews.require_code_owner_reviews=true \
  -F restrictions=
```

> Observação: para `v0/**`, use **Rulesets** (a proteção classic de branch não suporta wildcard no endpoint acima).

## Como verificar

1. Abra um PR de teste para `main` ou `v0/**`.
2. Confirme que o botão de merge fica bloqueado enquanto `validate` não estiver verde.
3. Confirme também a exigência de aprovação e resolução de conversas.

## Como desativar temporariamente (emergência)

1. Um admin pode ir em **Settings** → **Branches**.
2. Editar/desativar/remover a regra (ruleset ou classic) correspondente.
3. Aplicar o hotfix necessário.
4. Reativar a proteção imediatamente após a emergência.

⚠️ Isso deve ser exceção, não rotina. O padrão deve ser manter `validate` obrigatório para evitar regressões no deploy.
