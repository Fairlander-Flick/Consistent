-- Planner one-off todos and Life Essentials were local-only in v1. Add columns
-- so they sync across devices like every other store.
ALTER TABLE public.user_data
  ADD COLUMN IF NOT EXISTS dayplan    JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS essentials JSONB NOT NULL DEFAULT '{}';
