-- Script para criar usuários de teste no VeriFiBIN
-- IMPORTANTE: Execute este script APENAS após criar os usuários via Supabase Auth
-- Os IDs devem ser substituídos pelos IDs reais dos usuários criados

-- Removido tentativa de inserir diretamente na tabela users com IDs fictícios
-- Este script agora serve apenas como referência para inserção manual após criação via Auth

-- INSTRUÇÕES:
-- 1. Primeiro, crie os usuários via Supabase Auth Dashboard ou API
-- 2. Copie os IDs reais dos usuários criados
-- 3. Substitua os IDs abaixo pelos IDs reais
-- 4. Execute este script

-- Exemplo de como inserir após obter IDs reais:
/*
-- Configurar perfil do usuário normal de teste
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  credits,
  is_active,
  created_at,
  updated_at
) VALUES (
  'ID_REAL_DO_USUARIO'::uuid,  -- Substitua pelo ID real
  'teste.usuario@verifibin.com',
  'Usuário de Teste',
  'user',
  500,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  credits = EXCLUDED.credits,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Configurar perfil do administrador de teste
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  credits,
  is_active,
  created_at,
  updated_at
) VALUES (
  'ID_REAL_DO_ADMIN'::uuid,  -- Substitua pelo ID real
  'admin@verifibin.com',
  'Administrador Teste',
  'admin',
  1000,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  credits = EXCLUDED.credits,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
*/

-- Verificar usuários existentes
SELECT 
  id,
  email,
  full_name,
  role,
  credits,
  is_active,
  created_at
FROM public.users 
WHERE email IN ('teste.usuario@verifibin.com', 'admin@verifibin.com')
ORDER BY role DESC;
