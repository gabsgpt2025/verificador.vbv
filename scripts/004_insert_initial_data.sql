-- Initial data for VeriFiBIN system

-- Insert initial system configuration
INSERT INTO public.system_config (config_key, config_value, config_type, description) VALUES
('app_name', 'VeriFiBIN', 'string', 'Application name'),
('app_version', '1.0.0', 'string', 'Current application version'),
('default_user_credits', '100', 'number', 'Default credits for new users'),
('max_failed_login_attempts', '5', 'number', 'Maximum failed login attempts before lockout'),
('session_timeout_hours', '24', 'number', 'Session timeout in hours'),
('bin_verification_cost', '1', 'number', 'Credits cost per BIN verification'),
('maintenance_mode', 'false', 'boolean', 'Enable/disable maintenance mode'),
('api_rate_limit_per_minute', '60', 'number', 'API rate limit per minute per user'),
('neutrino_api_enabled', 'true', 'boolean', 'Enable Neutrino API integration'),
('email_notifications_enabled', 'true', 'boolean', 'Enable email notifications')
-- Removido ON CONFLICT pois config_key tem constraint UNIQUE
ON CONFLICT (config_key) DO NOTHING;

-- Insert initial tools
INSERT INTO public.tools (name, description, credits_cost, is_active) VALUES
('BIN Verification', 'Verify Bank Identification Numbers', 1, true),
('Card Type Detection', 'Detect card type and brand', 1, true),
('Issuer Information', 'Get detailed issuer information', 2, true),
('Fraud Risk Assessment', 'Assess fraud risk for BIN', 3, true),
('Batch BIN Processing', 'Process multiple BINs at once', 5, true)
-- Removido ON CONFLICT pois name tem constraint UNIQUE
ON CONFLICT (name) DO NOTHING;

-- Insert initial API status entries
INSERT INTO public.api_status (service_name, status, response_time_ms, uptime_percentage) VALUES
('Neutrino API', 'operational', 150, 99.9),
('Database', 'operational', 50, 99.95),
('Authentication Service', 'operational', 100, 99.8),
('Email Service', 'operational', 200, 99.5)
-- Removido ON CONFLICT pois service_name tem constraint UNIQUE
ON CONFLICT (service_name) DO NOTHING;

-- Insert initial system health metrics
-- Removido INSERT para system_health pois não tem constraint única para ON CONFLICT
INSERT INTO public.system_health (metric_name, metric_value, metric_unit, threshold_warning, threshold_critical, status) VALUES
('CPU Usage', 25.5, 'percentage', 70.0, 90.0, 'healthy'),
('Memory Usage', 45.2, 'percentage', 80.0, 95.0, 'healthy'),
('Disk Usage', 35.8, 'percentage', 85.0, 95.0, 'healthy'),
('Database Connections', 15, 'count', 80, 95, 'healthy'),
('Active Sessions', 25, 'count', 1000, 1500, 'healthy');
