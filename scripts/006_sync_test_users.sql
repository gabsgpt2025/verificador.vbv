-- Script to ensure test users are properly synced between auth.users and public.users
-- This script will create or update the public.users records for existing auth users

-- Insert or update test users in public.users table
INSERT INTO public.users (id, email, full_name, role, credits, is_active, created_at, updated_at)
VALUES 
  (
    (SELECT id FROM auth.users WHERE email = 'teste.usuario@verifibin.com' LIMIT 1),
    'teste.usuario@verifibin.com',
    'Usuário de Teste',
    'user',
    500,
    true,
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'admin@verifibin.com' LIMIT 1),
    'admin@verifibin.com',
    'Administrador Teste',
    'admin',
    1000,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) 
DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  credits = EXCLUDED.credits,
  is_active = EXCLUDED.is_active,
  updated_at = NOW()
WHERE users.id IS NOT NULL;

-- Corrigindo inserção no user_credits_log com todos os campos obrigatórios
-- Add initial credit log entries for test users
INSERT INTO user_credits_log (user_id, credits_before, credits_after, credits_used, operation_type, description, created_at)
SELECT 
  u.id,
  0,
  u.credits,
  0, -- credits_used deve ser 0 para operação de adição inicial
  'bonus', -- usando 'bonus' em vez de 'add' que não existe na constraint
  'Initial credits for test user',
  NOW()
FROM users u 
WHERE u.email IN ('teste.usuario@verifibin.com', 'admin@verifibin.com')
ON CONFLICT DO NOTHING;
