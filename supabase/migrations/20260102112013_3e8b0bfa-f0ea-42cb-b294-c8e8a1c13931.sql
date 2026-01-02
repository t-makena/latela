-- Remove audit triggers that are not needed and may cause issues
DROP TRIGGER IF EXISTS audit_accounts ON public.accounts;
DROP TRIGGER IF EXISTS audit_transactions ON public.transactions;