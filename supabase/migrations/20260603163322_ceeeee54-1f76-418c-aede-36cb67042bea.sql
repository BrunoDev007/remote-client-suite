CREATE TABLE public.client_plan_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_plan_id UUID NOT NULL REFERENCES public.client_plans(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (client_plan_id, client_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_plan_members TO authenticated;
GRANT ALL ON public.client_plan_members TO service_role;

ALTER TABLE public.client_plan_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage client plan members"
ON public.client_plan_members
FOR ALL
TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE INDEX idx_client_plan_members_plan ON public.client_plan_members(client_plan_id);
CREATE INDEX idx_client_plan_members_client ON public.client_plan_members(client_id);