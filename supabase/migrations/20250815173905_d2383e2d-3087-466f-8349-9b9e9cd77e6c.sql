-- Ensure RLS is enabled on clients table (idempotent)
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;

-- Harden security definer function by fixing search_path per linter recommendation
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;
