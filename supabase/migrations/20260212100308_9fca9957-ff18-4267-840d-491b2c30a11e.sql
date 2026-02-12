
-- Fix 1: Add missing RLS policies on merchants table
-- Currently only has DELETE policy, needs SELECT/INSERT/UPDATE

CREATE POLICY "Users can view their own and shared merchants"
  ON public.merchants
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own merchants"
  ON public.merchants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own merchants"
  ON public.merchants
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Fix 2: Tighten audit_logs INSERT policy
-- Current "System can insert audit logs" WITH CHECK (true) is too permissive
-- Replace with service_role only policy

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Only system can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
