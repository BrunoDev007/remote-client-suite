-- Update the user role to admin so they can access their data
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'bs.suporte.tec@gmail.com';