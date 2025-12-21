-- Add display_name and merchant_pattern columns to user_merchant_mappings
ALTER TABLE public.user_merchant_mappings 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS merchant_pattern TEXT;

-- Add display_merchant_name column to transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS display_merchant_name TEXT;

-- Drop and recreate the view to include display_merchant_name
DROP VIEW IF EXISTS public.v_transactions_with_details;

CREATE VIEW public.v_transactions_with_details AS
SELECT 
  t.id,
  t.user_id,
  t.account_id,
  t.transaction_date,
  t.amount,
  t.balance,
  t.cleared,
  t.description,
  t.raw_description,
  t.reference,
  t.transaction_code,
  t.merchant_id,
  t.category_id,
  t.subcategory_id,
  t.is_categorized,
  t.auto_categorized,
  t.categorization_confidence,
  t.user_verified,
  t.created_at,
  t.updated_at,
  -- Display merchant name: prefer user-set, then merchant table, then description
  COALESCE(t.display_merchant_name, m.merchant_name, t.description) AS merchant_name,
  t.display_merchant_name,
  -- Parent category info
  pc.name AS parent_category_name,
  pc.color AS parent_category_color,
  -- Subcategory info (from categories table)
  sc.name AS subcategory_name,
  sc.color AS subcategory_color,
  -- Display subcategory: prefer custom, then system subcategory
  COALESCE(ucc.name, sc.name) AS display_subcategory_name,
  COALESCE(ucc.color, sc.color) AS display_subcategory_color
FROM transactions t
LEFT JOIN merchants m ON t.merchant_id = m.id
LEFT JOIN categories pc ON t.category_id = pc.id
LEFT JOIN categories sc ON t.subcategory_id = sc.id
LEFT JOIN user_custom_categories ucc ON t.subcategory_id = ucc.id;

-- Create function to extract merchant core (first significant word)
CREATE OR REPLACE FUNCTION public.extract_merchant_core(description TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
  normalized TEXT;
  first_word TEXT;
BEGIN
  IF description IS NULL OR description = '' THEN
    RETURN '';
  END IF;
  
  -- First normalize the merchant name
  normalized := normalize_merchant_name(description);
  
  -- Extract first significant word (skip common prefixes)
  normalized := regexp_replace(normalized, '^\s*(THE|A|AN)\s+', '', 'i');
  
  -- Get the first word
  first_word := split_part(normalized, ' ', 1);
  
  -- Return first word if it's at least 2 characters
  IF length(first_word) >= 2 THEN
    RETURN first_word;
  END IF;
  
  RETURN normalized;
END;
$function$;

-- Function to check if two merchant names fuzzy match
CREATE OR REPLACE FUNCTION public.fuzzy_match_merchant(pattern TEXT, merchant_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
  pattern_core TEXT;
  merchant_core TEXT;
BEGIN
  IF pattern IS NULL OR pattern = '' OR merchant_name IS NULL OR merchant_name = '' THEN
    RETURN FALSE;
  END IF;
  
  pattern_core := extract_merchant_core(pattern);
  merchant_core := extract_merchant_core(merchant_name);
  
  -- Check if cores match (first word match)
  IF pattern_core = merchant_core THEN
    RETURN TRUE;
  END IF;
  
  -- Check if one starts with the other
  IF pattern_core LIKE merchant_core || '%' OR merchant_core LIKE pattern_core || '%' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if one contains the other (for patterns >= 4 chars)
  IF length(pattern_core) >= 4 AND (
    pattern_core LIKE '%' || merchant_core || '%' OR 
    merchant_core LIKE '%' || pattern_core || '%'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$function$;

-- Update the trigger to use fuzzy matching and apply display_merchant_name
CREATE OR REPLACE FUNCTION public.apply_user_merchant_mapping()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  mapping RECORD;
  normalized_merchant TEXT;
  merchant_core TEXT;
BEGIN
  -- Only process if category is not already set
  IF NEW.category_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Normalize the merchant name from description
  normalized_merchant := normalize_merchant_name(NEW.description);
  merchant_core := extract_merchant_core(NEW.description);
  
  IF normalized_merchant = '' THEN
    RETURN NEW;
  END IF;
  
  -- First try exact match on merchant_name
  SELECT category_id, subcategory_id, custom_subcategory_id, display_name
  INTO mapping
  FROM user_merchant_mappings 
  WHERE user_id = NEW.user_id 
    AND is_active = true
    AND upper(merchant_name) = normalized_merchant
  LIMIT 1;
  
  -- If no exact match, try fuzzy match using merchant_pattern or core extraction
  IF NOT FOUND AND merchant_core != '' THEN
    SELECT category_id, subcategory_id, custom_subcategory_id, display_name
    INTO mapping
    FROM user_merchant_mappings 
    WHERE user_id = NEW.user_id 
      AND is_active = true
      AND (
        -- Match on stored pattern
        (merchant_pattern IS NOT NULL AND fuzzy_match_merchant(merchant_pattern, normalized_merchant))
        OR
        -- Match on extracted core from stored merchant_name
        fuzzy_match_merchant(extract_merchant_core(merchant_name), merchant_core)
      )
    ORDER BY updated_at DESC
    LIMIT 1;
  END IF;
  
  IF FOUND THEN
    NEW.category_id := mapping.category_id;
    NEW.subcategory_id := COALESCE(mapping.subcategory_id, mapping.custom_subcategory_id);
    NEW.auto_categorized := false;
    NEW.user_verified := true;
    NEW.categorization_confidence := 1.0;
    NEW.is_categorized := true;
    -- Apply display name if set
    IF mapping.display_name IS NOT NULL THEN
      NEW.display_merchant_name := mapping.display_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;