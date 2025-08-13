-- Drop the overly permissive policy for financial_records
DROP POLICY IF EXISTS "Authenticated users can manage financial_records" ON public.financial_records;

-- Create secure policies for financial_records table
-- Only admins can view all financial records
CREATE POLICY "Admins can view all financial records" 
ON public.financial_records 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

-- Only admins can insert financial records
CREATE POLICY "Admins can insert financial records" 
ON public.financial_records 
FOR INSERT 
WITH CHECK (public.get_current_user_role() = 'admin');

-- Only admins can update financial records
CREATE POLICY "Admins can update financial records" 
ON public.financial_records 
FOR UPDATE 
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Only admins can delete financial records
CREATE POLICY "Admins can delete financial records" 
ON public.financial_records 
FOR DELETE 
USING (public.get_current_user_role() = 'admin');

-- Also secure the related tables with similar admin-only policies
-- Drop overly permissive policies for clients
DROP POLICY IF EXISTS "Authenticated users can manage clients" ON public.clients;

CREATE POLICY "Admins can manage clients" 
ON public.clients 
FOR ALL 
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Drop overly permissive policies for client_plans  
DROP POLICY IF EXISTS "Authenticated users can manage client_plans" ON public.client_plans;

CREATE POLICY "Admins can manage client_plans" 
ON public.client_plans 
FOR ALL 
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Drop overly permissive policies for plans
DROP POLICY IF EXISTS "Authenticated users can manage plans" ON public.plans;

CREATE POLICY "Admins can manage plans" 
ON public.plans 
FOR ALL 
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Drop overly permissive policies for remote_access
DROP POLICY IF EXISTS "Authenticated users can manage remote_access" ON public.remote_access;

CREATE POLICY "Admins can manage remote_access" 
ON public.remote_access 
FOR ALL 
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');