# 🔐 Credenciais de Teste - VeriFiBIN

## ⚡ ACESSO TEMPORÁRIO SEM SENHA (ativo agora)

> ⚠️ **O login está temporariamente configurado para funcionar sem senha.**
> Acesse `/auth/login` e use um dos botões de acesso rápido:
>
> - **"ENTRAR COMO ADMIN"** → redireciona para `/admin/dashboard` com role `admin`
> - **"ENTRAR COMO USUÁRIO"** → redireciona para `/dashboard` com role `user`
>
> Nenhuma credencial é necessária. O acesso é controlado pelo cookie `bypass_auth_role`.
>
> Para sair, use o botão "Log out" normalmente — o cookie será removido.

### Como reverter o bypass
Quando o Supabase estiver configurado e as credenciais reais estiverem disponíveis:
1. Remova `app/api/auth/bypass/route.ts`
2. Reverta os comentários `// TODO: REMOVER` em:
   - `lib/auth.ts`
   - `lib/supabase/middleware.ts`
   - `app/auth/login/page.tsx`
   - `components/auth/logout-button.tsx`

---

## 👤 Usuário Normal de Teste (Supabase)
- **Email:** `teste.usuario@verifibin.com`
- **Senha:** `usuario123`
- **Nome:** Usuário de Teste
- **Role:** `user`
- **Créditos Iniciais:** 500
- **Acesso:** Dashboard, Verificações BIN, Histórico

## 👨‍💼 Administrador de Teste (Supabase)
- **Email:** `admin@verifibin.com`
- **Senha:** `admin123`
- **Nome:** Administrador Teste
- **Role:** `admin`
- **Créditos Iniciais:** 1000
- **Acesso:** Dashboard, Admin Panel, Todas as funcionalidades

## 🚀 Como Usar (com Supabase configurado)

### 1. Iniciar o Sistema
```bash
cd /caminho/para/verifibin
npm run dev
```

### 2. Fazer Login
- Acesse: `http://localhost:3000/auth/login`
- Use uma das credenciais acima
- Será redirecionado para o dashboard

### 3. Testar Funcionalidades

#### Como Usuário Normal:
- ✅ Verificar BIN (consome créditos)
- ✅ Ver histórico de verificações
- ✅ Gerenciar créditos
- ✅ Atualizar perfil
- ❌ Não tem acesso ao painel admin

#### Como Administrador:
- ✅ Todas as funcionalidades do usuário
- ✅ Painel administrativo (`/admin`)
- ✅ Gerenciar outros usuários
- ✅ Ver logs do sistema
- ✅ Configurações avançadas

## 🔧 Solução de Problemas

### Erro: "Invalid login credentials"
1. Verifique se os usuários foram criados corretamente
2. Execute o script: `node scripts/setup-test-users.js`
3. Verifique no Supabase Dashboard se os usuários existem

### Usuário sem créditos ou role
1. Execute o SQL de atualização manual
2. Verifique a tabela `public.users`
3. Execute novamente o script de setup

### Redirecionamento não funciona
1. Verifique o middleware de autenticação
2. Confirme as variáveis de ambiente
3. Verifique os logs do console

## 📊 Verificação Manual

### Via SQL (Supabase Dashboard):
```sql
-- Verificar usuários de teste
SELECT id, email, full_name, role, credits, is_active
FROM public.users 
WHERE email ILIKE '%@verifibin.com'
ORDER BY role DESC;

-- Verificar logs de atividade
SELECT u.email, ual.activity_type, ual.created_at
FROM public.user_activity_logs ual
JOIN public.users u ON ual.user_id = u.id
WHERE u.email ILIKE '%@verifibin.com'
ORDER BY ual.created_at DESC;
```

### Via Interface:
1. Login com as credenciais
2. Verificar redirecionamento para dashboard
3. Confirmar saldo de créditos no header
4. Testar verificação BIN
5. Verificar histórico de transações

## 🛡️ Segurança

⚠️ **IMPORTANTE:** Estas são credenciais de TESTE apenas!

- Use apenas em ambiente de desenvolvimento
- Não use em produção
- Altere as senhas se necessário
- Remova os usuários de teste antes do deploy
- **Remova o bypass de senha antes de ir para produção**

## 📱 Status dos Arquivos

- ✅ `scripts/create-test-users.sql` - Script SQL manual
- ✅ `scripts/setup-test-users.js` - Script automático Node.js
- ✅ `README-CREDENCIAIS-TESTE.md` - Este arquivo
- ✅ Sistema de autenticação configurado
- ✅ Banco de dados estruturado
- ✅ Middleware de proteção ativo
- ⚠️ `app/api/auth/bypass/route.ts` - Bypass temporário sem senha (REMOVER em produção)
