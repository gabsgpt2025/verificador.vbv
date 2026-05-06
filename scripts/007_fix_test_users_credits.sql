-- Fix test users credits and ensure proper data consistency
-- This script ensures test users have correct credits and profiles

-- First, check if users exist in auth.users and create profiles if missing
DO $$
DECLARE
    test_user_id uuid;
    admin_user_id uuid;
BEGIN
    -- Get test user ID from auth.users
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'teste.usuario@verifibin.com' 
    LIMIT 1;
    
    -- Get admin user ID from auth.users  
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@verifibin.com' 
    LIMIT 1;
    
    -- Insert or update test user profile
    IF test_user_id IS NOT NULL THEN
        INSERT INTO public.users (id, email, full_name, role, credits, is_active, created_at, updated_at)
        VALUES (
            test_user_id,
            'teste.usuario@verifibin.com',
            'Usuário de Teste',
            'user',
            500,
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            credits = 500,
            role = 'user',
            full_name = 'Usuário de Teste',
            is_active = true,
            updated_at = NOW();
            
        -- Add initial credits log for test user
        INSERT INTO user_credits_log (
            user_id,
            operation_type,
            credits_before,
            credits_after,
            credits_used,
            description,
            created_at
        )
        VALUES (
            test_user_id,
            'bonus',
            0,
            500,
            0,
            'Initial test user credits',
            NOW()
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Insert or update admin user profile
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.users (id, email, full_name, role, credits, is_active, created_at, updated_at)
        VALUES (
            admin_user_id,
            'admin@verifibin.com',
            'Administrador Teste',
            'admin',
            1000,
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            credits = 1000,
            role = 'admin',
            full_name = 'Administrador Teste',
            is_active = true,
            updated_at = NOW();
            
        -- Add initial credits log for admin user
        INSERT INTO user_credits_log (
            user_id,
            operation_type,
            credits_before,
            credits_after,
            credits_used,
            description,
            created_at
        )
        VALUES (
            admin_user_id,
            'bonus',
            0,
            1000,
            0,
            'Initial admin user credits',
            NOW()
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Ensure BIN Pro 2.0 tool is configured correctly
INSERT INTO tools (
    name,
    description,
    credits_cost,
    is_active,
    api_endpoint,
    configuration,
    created_at,
    updated_at
)
VALUES (
    'BIN Pro 2.0',
    'Advanced BIN analysis with AI insights, ML scoring, and comprehensive fraud detection',
    3,
    true,
    '/api/bin-analysis',
    '{"features": ["ai_analysis", "ml_scoring", "fraud_detection", "currency_conversion", "3ds_analysis"], "ai_model": "grok-4", "max_retries": 3}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET
    credits_cost = 3,
    is_active = true,
    api_endpoint = '/api/bin-analysis',
    configuration = '{"features": ["ai_analysis", "ml_scoring", "fraud_detection", "currency_conversion", "3ds_analysis"], "ai_model": "grok-4", "max_retries": 3}'::jsonb,
    updated_at = NOW();
