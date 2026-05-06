-- VeriFiBIN 2.0 — Tabelas de Inteligência de BIN
-- Migration 008: bin_analysis_logs e bin_intelligence_overrides

-- Logs de análise de BIN (histórico completo)
CREATE TABLE IF NOT EXISTS public.bin_analysis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  bin TEXT NOT NULL,
  bin_length INTEGER NOT NULL DEFAULT 6,
  source_api TEXT NOT NULL DEFAULT 'UNKNOWN',
  api_response_hash TEXT,
  brand TEXT,
  type TEXT,
  category TEXT,
  country_code TEXT,
  issuer TEXT,
  is_prepaid BOOLEAN NOT NULL DEFAULT false,
  is_commercial BOOLEAN NOT NULL DEFAULT false,
  three_ds_status_estimated TEXT,
  three_ds_confidence TEXT,
  risk_score INTEGER,
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_bin_analysis_logs_bin ON public.bin_analysis_logs(bin);
CREATE INDEX IF NOT EXISTS idx_bin_analysis_logs_user_id ON public.bin_analysis_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_bin_analysis_logs_created_at ON public.bin_analysis_logs(created_at DESC);

-- Overrides/correções manuais de inteligência de BIN
CREATE TABLE IF NOT EXISTS public.bin_intelligence_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bin TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  corrected_value TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (confidence IN ('LOW', 'MEDIUM', 'HIGH')),
  reason TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'MANUAL',
  updated_by TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para lookup de overrides por BIN
CREATE INDEX IF NOT EXISTS idx_bin_intelligence_overrides_bin ON public.bin_intelligence_overrides(bin);

-- RLS (Row Level Security)
ALTER TABLE public.bin_analysis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bin_intelligence_overrides ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário vê apenas seus próprios logs
CREATE POLICY "Users can view own bin_analysis_logs"
  ON public.bin_analysis_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bin_analysis_logs"
  ON public.bin_analysis_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Overrides: somente admins podem gerenciar
CREATE POLICY "Admins can manage bin_intelligence_overrides"
  ON public.bin_intelligence_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
