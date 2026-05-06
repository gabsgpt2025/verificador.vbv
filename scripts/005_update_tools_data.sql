-- Corrigindo sintaxe JSON usando JSONB cast explícito
-- Update tools table with BIN verification tools and their costs
INSERT INTO public.tools (name, description, credits_cost, is_active, api_endpoint, configuration) VALUES
('bin_verification_basic', 'Basic BIN verification with essential card information', 1, true, '/api/bin/verify', '{"type": "basic", "features": ["card_brand", "card_type", "issuer_name", "issuer_country"]}'::jsonb),
('bin_verification_advanced', 'Advanced BIN verification with additional details', 2, true, '/api/bin/verify', '{"type": "advanced", "features": ["card_brand", "card_type", "card_level", "issuer_name", "issuer_country", "issuer_website", "issuer_phone"]}'::jsonb),
('bin_verification_premium', 'Premium BIN verification with comprehensive data', 3, true, '/api/bin/verify', '{"type": "premium", "features": ["card_brand", "card_type", "card_level", "issuer_name", "issuer_country", "issuer_website", "issuer_phone", "fraud_indicators", "spending_patterns"]}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  credits_cost = EXCLUDED.credits_cost,
  is_active = EXCLUDED.is_active,
  api_endpoint = EXCLUDED.api_endpoint,
  configuration = EXCLUDED.configuration,
  updated_at = NOW();
