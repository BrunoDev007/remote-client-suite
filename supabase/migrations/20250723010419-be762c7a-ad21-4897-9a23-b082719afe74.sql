-- Create authentication profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code SERIAL UNIQUE NOT NULL,
  client_type TEXT NOT NULL CHECK (client_type IN ('fisica', 'juridica')),
  name TEXT NOT NULL,
  birth_date DATE,
  phone TEXT,
  cep TEXT,
  address TEXT,
  number TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  email TEXT,
  
  -- Pessoa Física
  cpf TEXT,
  rg TEXT,
  
  -- Pessoa Jurídica
  company_name TEXT,
  fantasy_name TEXT,
  cnpj TEXT,
  state_registration TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plans table
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  value DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_plans table (relationship between clients and plans)
CREATE TABLE public.client_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  payment_date DATE NOT NULL,
  contract_url TEXT,
  value DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial records table
CREATE TABLE public.financial_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_plan_id UUID NOT NULL REFERENCES public.client_plans(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  value DECIMAL(10,2) NOT NULL,
  original_value DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('quitado', 'pendente', 'atrasado')),
  payment_method TEXT NOT NULL,
  change_reason TEXT,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create remote access table
CREATE TABLE public.remote_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  application_type TEXT NOT NULL CHECK (application_type IN ('AnyDesk', 'TeamViewer', 'RustDesk')),
  computer_name TEXT NOT NULL,
  access_id TEXT NOT NULL,
  access_password TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (authenticated users can access all data for now)
CREATE POLICY "Authenticated users can manage profiles" 
ON public.profiles FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage clients" 
ON public.clients FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage plans" 
ON public.plans FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage client_plans" 
ON public.client_plans FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage financial_records" 
ON public.financial_records FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage remote_access" 
ON public.remote_access FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_plans_updated_at
  BEFORE UPDATE ON public.client_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_records_updated_at
  BEFORE UPDATE ON public.financial_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_remote_access_updated_at
  BEFORE UPDATE ON public.remote_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update financial records when plan values change
CREATE OR REPLACE FUNCTION public.update_financial_records_on_plan_change()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger to update financial records when plan values change
CREATE TRIGGER update_financial_on_plan_change
  AFTER UPDATE OF value ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_financial_records_on_plan_change();