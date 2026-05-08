-- Grupo A — API alignment for real BIN history persistence
-- Idempotent: ensures the history table can store the normalized full result payload.

ALTER TABLE IF EXISTS public.bin_analysis_logs
  ADD COLUMN IF NOT EXISTS result JSONB;
