-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), 
    NEW.email, 
    'user'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_financial_records_on_plan_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update financial records for active client plans when plan value changes
  UPDATE public.financial_records 
  SET 
    value = NEW.value,
    updated_at = now()
  WHERE 
    plan_id = NEW.id 
    AND status = 'pendente'
    AND client_plan_id IN (
      SELECT id FROM public.client_plans 
      WHERE plan_id = NEW.id AND is_active = true
    );
  
  -- Update client_plans values
  UPDATE public.client_plans 
  SET 
    value = NEW.value,
    updated_at = now()
  WHERE 
    plan_id = NEW.id 
    AND is_active = true;
    
  RETURN NEW;
END;
$$;