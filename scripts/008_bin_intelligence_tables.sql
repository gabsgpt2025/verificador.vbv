-- VeriFiBIN 2.0 — Migration: BIN Intelligence Tables
-- TAREFA 5: Banco interno de inteligência antifraude
-- Creates: bin_analysis_logs, bin_intelligence_overrides

-- ─── Table: bin_analysis_logs ─────────────────────────────────────────────
-- Stores every BIN analysis performed, enabling learning over time

CREATE TABLE IF NOT EXISTS public.bin_analysis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- BIN data
  bin TEXT NOT NULL,
  bin8 TEXT, -- 8-digit BIN if available

  -- API response fingerprint (SHA256 of raw API response)
  api_response_hash TEXT,

  -- Card data from API
  issuer TEXT,
  country TEXT,
  country_code TEXT,
  card_type TEXT,
  card_category TEXT,
  is_prepaid BOOLEAN,
  is_commercial BOOLEAN,
  brand TEXT,

  -- Analysis results
  three_ds_status_estimated TEXT,
  three_ds_confidence TEXT,
  risk_score INTEGER,
  risk_level TEXT,
  recommendation TEXT,
  data_quality_score INTEGER,

  -- Source info
  source_api TEXT NOT NULL DEFAULT 'unknown',
  model_version TEXT,

  -- User info (optional)
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Audit/review fields
  notes TEXT,
  manual_review_status TEXT CHECK (
    manual_review_status IN ('pending', 'reviewed', 'escalated', 'closed')
  ) DEFAULT NULL,
  analyst_correction JSONB, -- stores analyst corrections as JSON

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast BIN lookups
CREATE INDEX IF NOT EXISTS idx_bin_analysis_logs_bin ON public.bin_analysis_logs (bin);
CREATE INDEX IF NOT EXISTS idx_bin_analysis_logs_bin8 ON public.bin_analysis_logs (bin8);
CREATE INDEX IF NOT EXISTS idx_bin_analysis_logs_user_id ON public.bin_analysis_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_bin_analysis_logs_created_at ON public.bin_analysis_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bin_analysis_logs_risk_score ON public.bin_analysis_logs (risk_score);

-- ─── Table: bin_intelligence_overrides ───────────────────────────────────
-- Stores manual analyst corrections that improve future analyses

CREATE TABLE IF NOT EXISTS public.bin_intelligence_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- BIN this override applies to
  bin TEXT NOT NULL,

  -- Which field is being corrected
  field TEXT NOT NULL, -- e.g. 'three_ds_status', 'card_type', 'issuer', 'is_prepaid'

  -- Correction data
  old_value TEXT,
  corrected_value TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('BAIXA', 'MEDIA', 'ALTA')),

  -- Justification
  reason TEXT NOT NULL,
  source TEXT, -- e.g. 'analyst_review', 'gateway_feedback', 'issuer_confirmation'

  -- Who made the correction
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint: one override per BIN+field combination (latest wins)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bin_overrides_bin_field
  ON public.bin_intelligence_overrides (bin, field);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_bin_overrides_bin ON public.bin_intelligence_overrides (bin);
CREATE INDEX IF NOT EXISTS idx_bin_overrides_updated_at ON public.bin_intelligence_overrides (updated_at DESC);

-- ─── Row Level Security ───────────────────────────────────────────────────

ALTER TABLE public.bin_analysis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bin_intelligence_overrides ENABLE ROW LEVEL SECURITY;

-- Users can see their own analysis logs
CREATE POLICY "Users can read their own bin analysis logs"
  ON public.bin_analysis_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all logs
CREATE POLICY "Admins can read all bin analysis logs"
  ON public.bin_analysis_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can insert analysis logs
CREATE POLICY "Service role can insert bin analysis logs"
  ON public.bin_analysis_logs FOR INSERT
  WITH CHECK (true);

-- Admins can manage overrides
CREATE POLICY "Admins can manage bin intelligence overrides"
  ON public.bin_intelligence_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- All authenticated users can read overrides (used during analysis)
CREATE POLICY "Authenticated users can read bin intelligence overrides"
  ON public.bin_intelligence_overrides FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ─── Function: apply_bin_overrides ───────────────────────────────────────
-- Called during analysis to apply any analyst corrections to raw API data

CREATE OR REPLACE FUNCTION public.get_bin_overrides(p_bin TEXT)
RETURNS TABLE (
  field TEXT,
  corrected_value TEXT,
  confidence TEXT,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
      o.field,
      o.corrected_value,
      o.confidence,
      o.reason
    FROM public.bin_intelligence_overrides o
    WHERE o.bin = p_bin
    ORDER BY o.updated_at DESC;
END;
$$;

-- ─── Trigger: update timestamps ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bin_analysis_logs_updated_at
  BEFORE UPDATE ON public.bin_analysis_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER bin_intelligence_overrides_updated_at
  BEFORE UPDATE ON public.bin_intelligence_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
