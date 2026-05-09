# Contribuindo

Obrigado por contribuir com o `verificador.vbv`.

## Rodando o projeto localmente

```bash
pnpm install
pnpm dev
```

## Convenção de nomes de branch

Use um prefixo de acordo com o tipo de trabalho:

- `feat/`
- `fix/`
- `chore/`
- `docs/`
- `refactor/`

## Convenção de commits

Este repositório usa **Conventional Commits**.

Exemplos:

- `feat(bin): adicionar validação de MCC`
- `fix(ci): corrigir script de typecheck`
- `docs(readme): atualizar instruções de setup`

## Fluxo de Pull Request

1. Crie uma branch a partir da `main`
2. Faça commits pequenos e objetivos
3. Abra PR para a `main`
4. CI verde obrigatório (`typecheck` + `lint` + `build`)
5. Aguarde review
6. Faça merge

## Regra de branches

Branches são deletadas automaticamente após o merge (`delete_branch_on_merge` habilitado).

## Como rodar testes

```bash
pnpm test
```

## Como rodar typecheck e lint localmente

```bash
pnpm typecheck
pnpm lint
```
