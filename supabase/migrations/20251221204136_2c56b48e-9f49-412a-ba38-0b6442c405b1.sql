-- Function to normalize merchant name (same logic as TypeScript)
CREATE OR REPLACE FUNCTION normalize_merchant_name(description TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  merchant TEXT;
BEGIN
  IF description IS NULL OR description = '' THEN
    RETURN '';
  END IF;
  
  merchant := description;
  
  -- Remove common transaction prefixes
  merchant := regexp_replace(merchant, '\mPURCHASE\M|\mDEBIT\M|\mCREDIT\M|\mPAYMENT\M|\mTRANSFER\M|\mPOS\M|\mATM\M|\mEFT\M', '', 'gi');
  
  -- Remove card numbers
  merchant := regexp_replace(merchant, '\mCARD\s+\d+', '', 'gi');
  merchant := regexp_replace(merchant, '\*+\d+', '', 'g');
  
  -- Remove dates in various formats
  merchant := regexp_replace(merchant, '\d{2}/\d{2}/\d{4}', '', 'g');
  merchant := regexp_replace(merchant, '\d{4}-\d{2}-\d{2}', '', 'g');
  merchant := regexp_replace(merchant, '\d{2}-\d{2}-\d{4}', '', 'g');
  merchant := regexp_replace(merchant, '\d{2}\.\d{2}\.\d{4}', '', 'g');
  
  -- Remove time patterns
  merchant := regexp_replace(merchant, '\d{2}:\d{2}(:\d{2})?', '', 'g');
  
  -- Remove reference numbers
  merchant := regexp_replace(merchant, 'REF\s*[:.]?\s*\d+', '', 'gi');
  merchant := regexp_replace(merchant, '\mTXN\s*[:.]?\s*\d+', '', 'gi');
  
  -- Remove currency amounts
  merchant := regexp_replace(merchant, 'R?\d+[.,]\d{2}', '', 'g');
  
  -- Remove trailing transaction IDs
  merchant := regexp_replace(merchant, '\s+\d{6,}$', '', 'g');
  
  -- Normalize whitespace
  merchant := regexp_replace(merchant, '\s+', ' ', 'g');
  merchant := trim(merchant);
  
  -- Take first part if multiple segments
  IF position('  ' in merchant) > 0 THEN
    merchant := split_part(merchant, '  ', 1);
  END IF;
  
  -- Limit length and uppercase
  merchant := upper(left(merchant, 100));
  
  RETURN merchant;
END;
$$;

-- Trigger function to apply user merchant mappings on transaction insert
CREATE OR REPLACE FUNCTION apply_user_merchant_mapping()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mapping RECORD;
  normalized_merchant TEXT;
BEGIN
  -- Only process if category is not already set
  IF NEW.category_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Normalize the merchant name from description
  normalized_merchant := normalize_merchant_name(NEW.description);
  
  IF normalized_merchant = '' THEN
    RETURN NEW;
  END IF;
  
  -- Check for user's merchant mapping
  SELECT category_id, subcategory_id, custom_subcategory_id 
  INTO mapping
  FROM user_merchant_mappings 
  WHERE user_id = NEW.user_id 
    AND is_active = true
    AND upper(merchant_name) = normalized_merchant
  LIMIT 1;
  
  IF FOUND THEN
    NEW.category_id := mapping.category_id;
    NEW.subcategory_id := COALESCE(mapping.subcategory_id, mapping.custom_subcategory_id);
    NEW.auto_categorized := false;
    NEW.user_verified := true;
    NEW.categorization_confidence := 1.0;
    NEW.is_categorized := true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on transactions table
DROP TRIGGER IF EXISTS apply_merchant_mapping_on_insert ON transactions;
CREATE TRIGGER apply_merchant_mapping_on_insert
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION apply_user_merchant_mapping();

-- Add index for faster merchant name lookups
CREATE INDEX IF NOT EXISTS idx_user_merchant_mappings_lookup 
  ON user_merchant_mappings (user_id, is_active, upper(merchant_name));