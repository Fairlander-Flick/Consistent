-- user_data: one row per authenticated user, JSONB per store
CREATE TABLE IF NOT EXISTS public.user_data (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  weight           JSONB NOT NULL DEFAULT '[]',
  goals            JSONB NOT NULL DEFAULT '{}',
  goals_log        JSONB NOT NULL DEFAULT '{}',
  training_program JSONB NOT NULL DEFAULT '{}',
  training_log     JSONB NOT NULL DEFAULT '[]',
  journal          JSONB NOT NULL DEFAULT '[]',
  finance          JSONB NOT NULL DEFAULT '{}',
  settings         JSONB NOT NULL DEFAULT '{}',
  schedule         JSONB NOT NULL DEFAULT '{}',
  schedule_done    JSONB NOT NULL DEFAULT '{}',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_data
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their data"
  ON public.user_data
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
