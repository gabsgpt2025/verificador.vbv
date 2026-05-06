# 🔧 Guia Completo: Configurar Usuários de Teste no VeriFiBIN

## ✅ Status Atual do Sistema
- **Autenticação:** Supabase Auth
- **Banco de Dados:** PostgreSQL via Supabase
- **Variáveis de Ambiente:** ⚠️ Precisam ser configuradas

## 🚀 Passos para Configuração Completa

### 1. Configurar Projeto Supabase
\`\`\`bash
# 1. Criar projeto no Supabase (https://app.supabase.com)
# 2. Anotar URL e anon key do projeto
# 3. Atualizar .env.local com credenciais reais
\`\`\`

### 2. Atualizar Variáveis de Ambiente
Edite `.env.local`:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
DATABASE_URL=postgresql://postgres:[senha]@db.[projeto].supabase.co:5432/postgres
NEUTRINO_API_KEY=your-neutrino-api-key
NEUTRINO_USER_ID=your-neutrino-user-id
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
\`\`\`

### 3. Executar Scripts de Banco de Dados
No Supabase Dashboard > SQL Editor:
\`\`\`sql
-- Execute na ordem:
-- 1. scripts/001_create_database_structure.sql
-- 2. scripts/002_enable_rls_policies.sql
-- 3. scripts/003_create_triggers_functions.sql
-- 4. scripts/004_insert_initial_data.sql
-- 5. scripts/005_update_tools_data.sql
\`\`\`

### 4. Criar Usuários de Teste Automaticamente
\`\`\`bash
cd /caminho/para/verifibin
npm install @supabase/supabase-js dotenv
node scripts/setup-test-users.js
\`\`\`

### 5. OU Criar Usuários Manualmente

#### Via Interface Web:
1. Iniciar servidor: `npm run dev`
2. Acessar: `http://localhost:3000/auth/register`
3. Criar usuários com os dados abaixo

#### Dados dos Usuários de Teste:

**👤 USUÁRIO NORMAL:**
- Email: `teste.usuario@verifibin.com`
- Senha: `usuario123`
- Nome: `Usuário de Teste`

**👨‍💼 ADMINISTRADOR:**
- Email: `admin@verifibin.com`
- Senha: `admin123`
- Nome: `Administrador Teste`

### 6. Ajustar Roles e Créditos (Via SQL)
Após criar os usuários, execute no Supabase:
\`\`\`sql
-- Buscar IDs dos usuários criados
SELECT id, email FROM auth.users 
WHERE email IN ('teste.usuario@verifibin.com', 'admin@verifibin.com');

-- Atualizar perfil do usuário normal
UPDATE public.users SET 
  role = 'user', 
  credits = 500,
  full_name = 'Usuário de Teste'
WHERE email = 'teste.usuario@verifibin.com';

-- Atualizar perfil do admin
UPDATE public.users SET 
  role = 'admin', 
  credits = 1000,
  full_name = 'Administrador Teste'
WHERE email = 'admin@verifibin.com';
\`\`\`

## 🧪 Como Testar

### Iniciar Sistema:
\`\`\`bash
cd /caminho/para/verifibin
npm run dev
\`\`\`

### Teste Login Usuário Normal:
1. Acesse: `http://localhost:3000/auth/login`
2. Login: `teste.usuario@verifibin.com` / `usuario123`
3. Deve redirecionar para `/dashboard`
4. Verificar 500 créditos

### Teste Login Administrador:
1. Acesse: `http://localhost:3000/auth/login`
2. Login: `admin@verifibin.com` / `admin123`
3. Deve redirecionar para `/dashboard`
4. Deve ter acesso a `/admin`
5. Verificar 1000 créditos

## 🔍 Verificação Rápida

### Método 1: Via Interface
1. Login com as credenciais
2. Verificar redirecionamento
3. Conferir saldo de créditos
4. Testar funcionalidades

### Método 2: Via SQL
\`\`\`sql
-- Verificar usuários criados
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
\`\`\`

## 🛠️ Solução de Problemas

### Problema: "Invalid login credentials"
**Solução:** Verificar se usuário existe em `auth.users` e se perfil existe em `public.users`

### Problema: Usuário sem role/créditos
**Solução:** Executar SQL de atualização manual dos perfis

### Problema: Erro de variáveis ambiente
**Solução:** Verificar configuração do `.env.local`

### Problema: Tabelas não existem
**Solução:** Executar scripts SQL de criação da estrutura

## 📱 Status dos Arquivos Criados
- ✅ `scripts/create-test-users.sql` - Script SQL para criar usuários
- ✅ `scripts/setup-test-users.js` - Script Node.js automático
- ✅ `README-CREDENCIAIS-TESTE.md` - Documentação das credenciais
- ✅ `CONFIGURACAO-USUARIO-TESTE.md` - Este guia

## 🎯 Próximos Passos
1. Configurar variáveis de ambiente
2. Executar scripts de banco de dados
3. Criar usuários de teste
4. Testar funcionalidades
5. Prosseguir para próximas etapas do desenvolvimento
