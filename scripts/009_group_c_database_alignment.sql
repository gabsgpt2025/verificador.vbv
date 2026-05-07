-- Grupo C — Database alignment (Supabase/Postgres)
-- Idempotent migration to align SQL schema with app usage and harden RLS.

-- 1) Ensure bin_analysis_logs supports all fields used by the application
ALTER TABLE IF EXISTS public.bin_analysis_logs
  ADD COLUMN IF NOT EXISTS bin_length INTEGER NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS bin8 TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS card_type TEXT,
  ADD COLUMN IF NOT EXISTS card_category TEXT,
  ADD COLUMN IF NOT EXISTS risk_level TEXT,
  ADD COLUMN IF NOT EXISTS data_quality_score INTEGER,
  ADD COLUMN IF NOT EXISTS model_version TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT;

CREATE INDEX IF NOT EXISTS idx_bin_analysis_logs_bin8 ON public.bin_analysis_logs (bin8);

-- 2) Keep login-failure logging compatible with browser inserts
ALTER TABLE IF EXISTS public.failed_login_attempts
  ALTER COLUMN ip_address DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'failed_login_attempts'
      AND policyname = 'failed_login_attempts_insert_public'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "failed_login_attempts_insert_public"
      ON public.failed_login_attempts
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (email IS NOT NULL AND length(trim(email)) > 0)
    $policy$;
  END IF;
END
$$;

-- 3) RLS hardening/fixes for app flows
DROP POLICY IF EXISTS "Service role can insert bin analysis logs" ON public.bin_analysis_logs;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bin_analysis_logs'
      AND policyname = 'Users can insert own bin analysis logs'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can insert own bin analysis logs"
      ON public.bin_analysis_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id)
    $policy$;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bin_intelligence_overrides'
      AND policyname = 'Authenticated users can read bin intelligence overrides'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can read bin intelligence overrides"
      ON public.bin_intelligence_overrides
      FOR SELECT
      TO authenticated
      USING (true)
    $policy$;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'suspicious_sessions'
      AND policyname = 'suspicious_sessions_insert_own'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "suspicious_sessions_insert_own"
      ON public.suspicious_sessions
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid())
    $policy$;
  END IF;
END
$$;

-- 4) Atomic credit operations in a single transaction-safe RPC
CREATE OR REPLACE FUNCTION public.process_credit_operation(
  p_user_id UUID,
  p_operation TEXT,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL,
  p_operation_type TEXT DEFAULT 'verification',
  p_payment_amount DECIMAL(10,2) DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_balance INTEGER,
  transaction_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester UUID := auth.uid();
  v_is_admin BOOLEAN := false;
  v_current_credits INTEGER;
  v_new_credits INTEGER;
  v_credits_delta INTEGER;
  v_transaction_id UUID := NULL;
BEGIN
  IF v_requester IS NULL THEN
    RETURN QUERY SELECT false, 'Unauthorized', NULL::INTEGER, NULL::UUID;
    RETURN;
  END IF;

  SELECT COALESCE(role = 'admin', false)
  INTO v_is_admin
  FROM public.users
  WHERE id = v_requester;

  IF v_requester <> p_user_id AND NOT v_is_admin THEN
    RETURN QUERY SELECT false, 'Forbidden', NULL::INTEGER, NULL::UUID;
    RETURN;
  END IF;

  IF p_amount < 0 THEN
    RETURN QUERY SELECT false, 'Amount must be >= 0', NULL::INTEGER, NULL::UUID;
    RETURN;
  END IF;

  SELECT credits
  INTO v_current_credits
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RETURN QUERY SELECT false, 'User not found', NULL::INTEGER, NULL::UUID;
    RETURN;
  END IF;

  CASE lower(p_operation)
    WHEN 'add' THEN
      v_new_credits := v_current_credits + p_amount;
      v_credits_delta := p_amount;

    WHEN 'subtract' THEN
      IF v_current_credits < p_amount THEN
        RETURN QUERY SELECT false, 'Insufficient credits', NULL::INTEGER, NULL::UUID;
        RETURN;
      END IF;
      v_new_credits := v_current_credits - p_amount;
      v_credits_delta := -p_amount;

    WHEN 'reset' THEN
      v_new_credits := p_amount;
      v_credits_delta := p_amount - v_current_credits;

    WHEN 'purchase' THEN
      IF p_payment_amount IS NULL THEN
        RETURN QUERY SELECT false, 'Payment amount is required for purchase', NULL::INTEGER, NULL::UUID;
        RETURN;
      END IF;

      v_new_credits := v_current_credits + p_amount;
      v_credits_delta := p_amount;

      INSERT INTO public.transactions (
        user_id,
        transaction_type,
        amount,
        credits,
        status,
        payment_method,
        payment_reference,
        completed_at
      )
      VALUES (
        p_user_id,
        'credit_purchase',
        p_payment_amount,
        p_amount,
        'completed',
        p_payment_method,
        p_payment_reference,
        NOW()
      )
      RETURNING id INTO v_transaction_id;

    ELSE
      RETURN QUERY SELECT false, 'Invalid operation', NULL::INTEGER, NULL::UUID;
      RETURN;
  END CASE;

  UPDATE public.users
  SET credits = v_new_credits,
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.user_credits_log (
    user_id,
    credits_before,
    credits_after,
    credits_used,
    operation_type,
    description
  )
  VALUES (
    p_user_id,
    v_current_credits,
    v_new_credits,
    v_credits_delta,
    p_operation_type,
    COALESCE(p_description, 'Credit operation: ' || p_operation)
  );

  RETURN QUERY SELECT true, 'Credit operation completed', v_new_credits, v_transaction_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_credit_operation(
  UUID,
  TEXT,
  INTEGER,
  TEXT,
  TEXT,
  DECIMAL,
  TEXT,
  TEXT
) TO authenticated;
