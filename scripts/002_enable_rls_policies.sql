-- Enable Row Level Security (RLS) for all tables
-- Security is non-negotiable

-- Users table RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admin can view all users
CREATE POLICY "admin_users_select_all" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User Sessions RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_sessions_select_own" ON public.user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_sessions_insert_own" ON public.user_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_sessions_update_own" ON public.user_sessions
  FOR UPDATE USING (user_id = auth.uid());

-- Failed Login Attempts RLS (Admin only)
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_failed_login_select" ON public.failed_login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Suspicious Sessions RLS
ALTER TABLE public.suspicious_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suspicious_sessions_select_own" ON public.suspicious_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admin_suspicious_sessions_all" ON public.suspicious_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User Credits Log RLS
ALTER TABLE public.user_credits_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_credits_log_select_own" ON public.user_credits_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_credits_log_insert_own" ON public.user_credits_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Transactions RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "transactions_insert_own" ON public.transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_update_own" ON public.transactions
  FOR UPDATE USING (user_id = auth.uid());

-- Finance Reconciliation Logs RLS (Admin only)
ALTER TABLE public.finance_reconciliation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_finance_reconciliation_all" ON public.finance_reconciliation_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- BIN Verifications RLS
ALTER TABLE public.bin_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bin_verifications_select_own" ON public.bin_verifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "bin_verifications_insert_own" ON public.bin_verifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_bin_verifications_all" ON public.bin_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User Activity Logs RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_activity_logs_select_own" ON public.user_activity_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_activity_logs_insert_own" ON public.user_activity_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_user_activity_logs_all" ON public.user_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Neutrino Usage Logs RLS
ALTER TABLE public.neutrino_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "neutrino_usage_logs_select_own" ON public.neutrino_usage_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "neutrino_usage_logs_insert_own" ON public.neutrino_usage_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- System Logs RLS (Admin only)
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_system_logs_all" ON public.system_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Security Audit Logs RLS
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_audit_logs_select_own" ON public.security_audit_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "security_audit_logs_insert_own" ON public.security_audit_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_security_audit_logs_all" ON public.security_audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- API Status RLS (Admin only)
ALTER TABLE public.api_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_api_status_all" ON public.api_status
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System Health RLS (Admin only)
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_system_health_all" ON public.system_health
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System Config RLS (Admin only)
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_system_config_all" ON public.system_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tools RLS (Read for all authenticated users, write for admin)
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tools_select_authenticated" ON public.tools
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "admin_tools_all" ON public.tools
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
