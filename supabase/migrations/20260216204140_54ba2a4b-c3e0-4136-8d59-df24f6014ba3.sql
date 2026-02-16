
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_username TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  v_username := NEW.raw_user_meta_data->>'username';
  
  -- Sanitize username: replace spaces with underscores, strip invalid chars
  v_username := regexp_replace(
    regexp_replace(COALESCE(v_username, ''), '\s+', '_', 'g'),
    '[^a-zA-Z0-9_]', '', 'g'
  );
  
  -- Validate: must start with letter, 3-30 chars; otherwise NULL
  IF v_username = '' OR length(v_username) < 3 OR v_username !~ '^[a-zA-Z]' THEN
    v_username := NULL;
  ELSIF length(v_username) > 30 THEN
    v_username := left(v_username, 30);
  END IF;

  -- Try to get first/last name directly from metadata
  v_first_name := NEW.raw_user_meta_data->>'first_name';
  v_last_name := NEW.raw_user_meta_data->>'last_name';
  
  -- If first_name not provided, parse from original username metadata
  IF (v_first_name IS NULL OR v_first_name = '') THEN
    DECLARE
      v_raw_username TEXT := NEW.raw_user_meta_data->>'username';
    BEGIN
      IF v_raw_username IS NOT NULL AND v_raw_username != '' THEN
        v_first_name := split_part(v_raw_username, ' ', 1);
        v_last_name := nullif(trim(substring(v_raw_username from length(v_first_name) + 2)), '');
      END IF;
    END;
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
$function$;
