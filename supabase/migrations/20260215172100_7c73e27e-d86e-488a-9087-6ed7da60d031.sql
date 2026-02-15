
-- Update handle_new_user to parse username into first_name/last_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_username TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  v_username := NEW.raw_user_meta_data->>'username';
  
  -- Try to get first/last name directly from metadata
  v_first_name := NEW.raw_user_meta_data->>'first_name';
  v_last_name := NEW.raw_user_meta_data->>'last_name';
  
  -- If first_name not provided, parse from username
  IF (v_first_name IS NULL OR v_first_name = '') AND v_username IS NOT NULL AND v_username != '' THEN
    v_first_name := split_part(v_username, ' ', 1);
    v_last_name := nullif(trim(substring(v_username from length(v_first_name) + 2)), '');
  END IF;
  
  -- Fallback to email prefix if still no name
  IF v_first_name IS NULL OR v_first_name = '' THEN
    v_first_name := split_part(NEW.email, '@', 1);
  END IF;

  INSERT INTO public.user_settings (user_id, username, display_name, email, mobile, first_name, last_name, email_verified)
  VALUES (
    NEW.id,
    v_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', v_username, ''),
    NEW.email,
    NEW.raw_user_meta_data->>'mobile',
    v_first_name,
    v_last_name,
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
