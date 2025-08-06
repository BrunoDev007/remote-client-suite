-- Add start_date and end_date columns to client_plans table
ALTER TABLE public.client_plans 
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;