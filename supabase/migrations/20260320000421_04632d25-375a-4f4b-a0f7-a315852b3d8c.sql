
-- 1. Move pg_trgm from public to extensions (CASCADE to drop dependent index, then recreate)
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO public;

-- Recreate the dependent index using extensions schema operator class
CREATE INDEX idx_merchant_patterns_trgm ON public.merchant_patterns USING gin (pattern extensions.gin_trgm_ops);

-- 2. Fix functions with mutable search_path

CREATE OR REPLACE FUNCTION public.cleanup_expired_nonces()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
begin delete from public.oauth_nonces where expires_at < now() or consumed = true; end;
$function$;

CREATE OR REPLACE FUNCTION public.fuzzy_match_merchant(pattern text, merchant_name text)
 RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = public, extensions
AS $function$
DECLARE pattern_core TEXT; merchant_core TEXT;
BEGIN
  IF pattern IS NULL OR pattern = '' OR merchant_name IS NULL OR merchant_name = '' THEN RETURN FALSE; END IF;
  pattern_core := extract_merchant_core(pattern);
  merchant_core := extract_merchant_core(merchant_name);
  IF pattern_core = merchant_core THEN RETURN TRUE; END IF;
  IF pattern_core LIKE merchant_core || '%' OR merchant_core LIKE pattern_core || '%' THEN RETURN TRUE; END IF;
  IF length(pattern_core) >= 4 AND (pattern_core LIKE '%' || merchant_core || '%' OR merchant_core LIKE '%' || pattern_core || '%') THEN RETURN TRUE; END IF;
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_daily_spending(p_user_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(spend_date date, total_amount_cents bigint, transaction_count bigint)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  RETURN QUERY SELECT t.transaction_date::DATE AS spend_date, COALESCE(SUM(ABS(t.amount)), 0)::BIGINT AS total_amount_cents, COUNT(t.id)::BIGINT AS transaction_count
  FROM public.transactions t WHERE t.user_id = p_user_id AND t.transaction_date >= p_start_date AND t.transaction_date <= p_end_date AND t.amount < 0
  GROUP BY t.transaction_date::DATE ORDER BY spend_date;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_monthly_spending_trends(p_user_id uuid, p_months integer DEFAULT 12)
 RETURNS TABLE(month_year text, month_start date, total_income_cents bigint, total_expenses_cents bigint, net_cents bigint, transaction_count bigint)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  RETURN QUERY SELECT TO_CHAR(DATE_TRUNC('month', t.transaction_date), 'Mon YYYY') AS month_year, DATE_TRUNC('month', t.transaction_date)::DATE AS month_start,
    COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0)::BIGINT AS total_income_cents,
    COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0)::BIGINT AS total_expenses_cents,
    COALESCE(SUM(t.amount), 0)::BIGINT AS net_cents, COUNT(t.id)::BIGINT AS transaction_count
  FROM public.transactions t WHERE t.user_id = p_user_id AND t.transaction_date >= (CURRENT_DATE - (p_months || ' months')::INTERVAL)
  GROUP BY DATE_TRUNC('month', t.transaction_date) ORDER BY month_start DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_or_create_user_settings()
 RETURNS user_settings LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_settings public.user_settings;
BEGIN
  SELECT * INTO v_settings FROM public.user_settings WHERE user_id = auth.uid();
  IF v_settings IS NULL THEN INSERT INTO public.user_settings (user_id) VALUES (auth.uid()) RETURNING * INTO v_settings; END IF;
  RETURN v_settings;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_spending_by_category(p_user_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(category_id uuid, category_name text, category_color text, total_amount_cents bigint, transaction_count bigint, percentage numeric)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_total BIGINT;
BEGIN
  SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_total FROM public.transactions WHERE user_id = p_user_id AND transaction_date >= p_start_date AND transaction_date <= p_end_date AND amount < 0;
  RETURN QUERY SELECT c.id AS category_id, c.name AS category_name, c.color AS category_color, COALESCE(SUM(ABS(t.amount)), 0)::BIGINT AS total_amount_cents, COUNT(t.id)::BIGINT AS transaction_count,
    CASE WHEN v_total > 0 THEN ROUND((COALESCE(SUM(ABS(t.amount)), 0)::NUMERIC / v_total) * 100, 2) ELSE 0 END AS percentage
  FROM public.categories c LEFT JOIN public.transactions t ON t.category_id = c.id AND t.user_id = p_user_id AND t.transaction_date >= p_start_date AND t.transaction_date <= p_end_date AND t.amount < 0
  WHERE c.user_id = p_user_id OR c.is_default = true GROUP BY c.id, c.name, c.color HAVING COALESCE(SUM(ABS(t.amount)), 0) > 0 ORDER BY total_amount_cents DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_top_merchants(p_user_id uuid, p_start_date date, p_end_date date, p_limit integer DEFAULT 10)
 RETURNS TABLE(merchant_name text, total_amount_cents bigint, transaction_count bigint, avg_transaction_cents bigint)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  RETURN QUERY SELECT t.description AS merchant_name, COALESCE(SUM(ABS(t.amount)), 0)::BIGINT AS total_amount_cents, COUNT(t.id)::BIGINT AS transaction_count,
    (COALESCE(SUM(ABS(t.amount)), 0) / NULLIF(COUNT(t.id), 0))::BIGINT AS avg_transaction_cents
  FROM public.transactions t WHERE t.user_id = p_user_id AND t.transaction_date >= p_start_date AND t.transaction_date <= p_end_date AND t.amount < 0
  GROUP BY t.description ORDER BY total_amount_cents DESC LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$function$;

CREATE OR REPLACE FUNCTION public.search_transaction_descriptions(p_user_id uuid, p_search_term text, p_limit integer DEFAULT 10)
 RETURNS TABLE(description text, category_id uuid, category_name text, occurrence_count bigint, similarity_score numeric)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $function$
BEGIN
  RETURN QUERY SELECT t.description, t.category_id, c.name AS category_name, COUNT(*)::BIGINT AS occurrence_count, similarity(t.description, p_search_term)::NUMERIC AS similarity_score
  FROM public.transactions t LEFT JOIN public.categories c ON c.id = t.category_id
  WHERE t.user_id = p_user_id AND similarity(t.description, p_search_term) > 0.2
  GROUP BY t.description, t.category_id, c.name ORDER BY similarity_score DESC, occurrence_count DESC LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_income_settings(p_income_amount_cents bigint, p_income_frequency text, p_payday integer, p_income_sources jsonb DEFAULT '[]'::jsonb)
 RETURNS user_settings LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_settings public.user_settings;
BEGIN
  INSERT INTO public.user_settings (user_id, income_amount_cents, income_frequency, payday, income_sources, updated_at)
  VALUES (auth.uid(), p_income_amount_cents, p_income_frequency, p_payday, p_income_sources, NOW())
  ON CONFLICT (user_id) DO UPDATE SET income_amount_cents = EXCLUDED.income_amount_cents, income_frequency = EXCLUDED.income_frequency, payday = EXCLUDED.payday, income_sources = EXCLUDED.income_sources, updated_at = NOW()
  RETURNING * INTO v_settings;
  RETURN v_settings;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_profiles_timestamp()
 RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $function$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_settings_timestamp()
 RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $function$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$function$;

-- 3. Fix overly permissive RLS policies

DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Public can join waitlist" ON public.waitlist;
CREATE POLICY "Public can join waitlist" ON public.waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND length(trim(email)) > 0);

DROP POLICY IF EXISTS "Service role full access" ON public.whatsapp_messages;
CREATE POLICY "Service role full access" ON public.whatsapp_messages
  FOR ALL TO authenticated
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on whatsapp_sessions" ON public.whatsapp_sessions;
CREATE POLICY "Service role full access on whatsapp_sessions" ON public.whatsapp_sessions
  FOR ALL TO authenticated
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
