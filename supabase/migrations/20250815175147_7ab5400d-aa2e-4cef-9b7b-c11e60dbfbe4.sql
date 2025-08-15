-- Ensure RLS is enabled on financial_records table (idempotent)
ALTER TABLE IF EXISTS public.financial_records ENABLE ROW LEVEL SECURITY;
