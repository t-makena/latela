
-- Check if RLS is enabled and add policies for the transactions table
-- Since there are no RLS policies currently, we need to either disable RLS or add appropriate policies

-- Option 1: Disable RLS for now to allow all access (simpler for testing)
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, uncomment the lines below instead
-- ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- 
-- -- Allow all users to read transactions (adjust this based on your security needs)
-- CREATE POLICY "Allow public read access to transactions" 
--   ON public.transactions 
--   FOR SELECT 
--   USING (true);
