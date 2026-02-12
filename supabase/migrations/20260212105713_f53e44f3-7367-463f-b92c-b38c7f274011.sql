
-- Fix Security Definer Views: Set security_invoker=true on all public views
ALTER VIEW public.v_user_merchant_mappings SET (security_invoker = true);
ALTER VIEW public.v_transactions_with_details SET (security_invoker = true);
ALTER VIEW public.v_user_available_subcategories SET (security_invoker = true);
ALTER VIEW public.cheapest_products SET (security_invoker = true);
ALTER VIEW public.current_sales SET (security_invoker = true);

-- Fix Function Search Path Mutable: Set search_path on all functions missing it

-- Simple trigger functions
CREATE OR REPLACE FUNCTION public.update_grocery_prices_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_canonical_products_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_product_offers_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_user_merchant_mappings_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_transactions_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.accounts SET current_balance = current_balance + NEW.amount, updated_at = NOW() WHERE id = NEW.account_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.accounts SET current_balance = current_balance - OLD.amount, updated_at = NOW() WHERE id = OLD.account_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.account_id != NEW.account_id THEN
      UPDATE public.accounts SET current_balance = current_balance - OLD.amount, updated_at = NOW() WHERE id = OLD.account_id;
      UPDATE public.accounts SET current_balance = current_balance + NEW.amount, updated_at = NOW() WHERE id = NEW.account_id;
    ELSE
      UPDATE public.accounts SET current_balance = current_balance - OLD.amount + NEW.amount, updated_at = NOW() WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END; $$;

-- SECURITY DEFINER functions - add search_path
CREATE OR REPLACE FUNCTION public.insert_transaction(p_account_id uuid, p_description text, p_amount numeric, p_date date, p_category_id uuid DEFAULT NULL::uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id UUID; v_transaction_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = p_account_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Account not found or access denied';
  END IF;
  IF p_description IS NULL OR LENGTH(TRIM(p_description)) = 0 THEN RAISE EXCEPTION 'Description is required'; END IF;
  IF p_amount IS NULL THEN RAISE EXCEPTION 'Amount is required'; END IF;
  INSERT INTO public.transactions (user_id, account_id, description, amount, date, category_id, created_at)
  VALUES (v_user_id, p_account_id, TRIM(p_description), p_amount, COALESCE(p_date, CURRENT_DATE), p_category_id, NOW())
  RETURNING id INTO v_transaction_id;
  RETURN v_transaction_id;
END; $$;

CREATE OR REPLACE FUNCTION public.is_username_available(check_username text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF check_username IS NULL OR NOT (check_username ~* '^[a-zA-Z][a-zA-Z0-9_]{2,29}$') THEN RETURN false; END IF;
  RETURN NOT EXISTS (SELECT 1 FROM public.user_settings WHERE LOWER(username) = LOWER(check_username));
END; $$;

CREATE OR REPLACE FUNCTION public.get_profile_by_username(lookup_username text)
RETURNS TABLE(user_id uuid, username text, display_name text, avatar_url text, bio text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY SELECT us.user_id, us.username, us.display_name, us.avatar_url, us.bio
  FROM public.user_settings us WHERE LOWER(us.username) = LOWER(lookup_username);
END; $$;

CREATE OR REPLACE FUNCTION public.update_last_active()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE public.user_settings SET last_active_at = NOW() WHERE user_id = auth.uid(); END; $$;

CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data) VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data) VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data) VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  DELETE FROM public.transactions WHERE user_id = v_user_id;
  DELETE FROM public.budgets WHERE user_id = v_user_id;
  DELETE FROM public.goals WHERE user_id = v_user_id;
  DELETE FROM public.accounts WHERE user_id = v_user_id;
  DELETE FROM public.categories WHERE user_id = v_user_id;
END; $$;

-- search_products function
CREATE OR REPLACE FUNCTION public.search_products(search_query text, result_limit integer DEFAULT 20)
RETURNS TABLE(id uuid, name text, brand text, category text, quantity_value numeric, quantity_unit text, image_url text, offers jsonb)
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT cp.id, cp.name, cp.brand, cp.category, cp.quantity_value, cp.quantity_unit, cp.image_url,
    COALESCE(jsonb_agg(jsonb_build_object('store', po.store, 'price_cents', po.price_cents, 'unit_price_cents', po.unit_price_cents, 'in_stock', po.in_stock, 'on_sale', po.on_sale, 'promotion_text', po.promotion_text, 'product_url', po.product_url) ORDER BY po.price_cents ASC) FILTER (WHERE po.id IS NOT NULL), '[]'::jsonb) as offers
  FROM canonical_products cp
  LEFT JOIN product_offers po ON po.canonical_product_id = cp.id
  WHERE cp.name ILIKE '%' || search_query || '%' OR cp.brand ILIKE '%' || search_query || '%'
  GROUP BY cp.id
  LIMIT result_limit;
END; $$;
