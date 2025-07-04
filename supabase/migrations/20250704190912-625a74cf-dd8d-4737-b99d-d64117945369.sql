
-- Enable RLS on accounts table if not already enabled
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view accounts (you may want to restrict this further based on your needs)
CREATE POLICY "Enable read access for all users" ON public.accounts
FOR SELECT USING (true);

-- If you want to restrict access to only authenticated users, use this instead:
-- CREATE POLICY "Enable read access for authenticated users only" ON public.accounts
-- FOR SELECT USING (auth.role() = 'authenticated');
