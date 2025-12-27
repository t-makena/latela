-- Fix: Remove overly permissive RLS policy on accounts table
-- The proper user-scoped policies already exist, so we just need to drop the insecure one
DROP POLICY IF EXISTS "Enable read access for all users" ON public.accounts;