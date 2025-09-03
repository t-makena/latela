-- Fix the remaining functions to set search_path

CREATE OR REPLACE FUNCTION public.daily_goals_update()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE goals 
  SET months_left = GREATEST(
    EXTRACT(YEAR FROM AGE(timeline_date, CURRENT_DATE)) * 12 + 
    EXTRACT(MONTH FROM AGE(timeline_date, CURRENT_DATE)),
    1
  ),
  updated_at = NOW()
  WHERE is_completed = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_budget_balance(p_user_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  available_balance DECIMAL(15,2);
  upcoming_events DECIMAL(15,2);
  goals_remaining DECIMAL(15,2);
BEGIN
  -- Ensure user is authenticated and can only access their own data
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only access own budget balance';
  END IF;
  
  SELECT get_total_available_balance(auth.uid()) INTO available_balance;
  SELECT get_upcoming_events_total(auth.uid()) INTO upcoming_events;
  SELECT get_total_goals_target(auth.uid()) INTO goals_remaining;
  
  RETURN (available_balance - upcoming_events - goals_remaining);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_current_allocations_from_split(user_uuid uuid, total_current_savings numeric)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  -- Ensure user is authenticated and can only access their own data
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF user_uuid != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only update own allocations';
  END IF;
  
  UPDATE goals 
  SET current_allocation = ROUND((split_percentage / 100) * total_current_savings, 2)
  WHERE user_id = auth.uid();
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.redistribute_priorities_for_user(manually_set_goal_id uuid, new_priority_percentage numeric)
 RETURNS TABLE(goal_id uuid, goal_name text, old_priority numeric, new_priority numeric, adjustment_type text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  user_uuid UUID := auth.uid();
  total_manual_priority DECIMAL(8,4) := 0;
  remaining_percentage DECIMAL(8,4);
  total_auto_priority DECIMAL(8,4) := 0;
  goal_record RECORD;
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Verify the goal belongs to the current user (RLS will also enforce this)
  IF NOT EXISTS (SELECT 1 FROM goals WHERE id = manually_set_goal_id AND user_id = user_uuid) THEN
    RAISE EXCEPTION 'Goal not found or does not belong to current user';
  END IF;
  
  -- Set manual priority (RLS ensures only user's goal is updated)
  UPDATE goals 
  SET 
    priority_percentage = new_priority_percentage,
    manual_priority_override = TRUE
  WHERE id = manually_set_goal_id;
  
  -- Calculate remaining percentage (RLS filters to user's goals only)
  SELECT COALESCE(SUM(priority_percentage), 0) INTO total_manual_priority
  FROM goals 
  WHERE manual_priority_override = TRUE AND is_completed = FALSE;
  
  remaining_percentage := 100.0 - total_manual_priority;
  
  SELECT COALESCE(SUM(priority_percentage), 0) INTO total_auto_priority
  FROM goals 
  WHERE manual_priority_override = FALSE AND is_completed = FALSE;
  
  -- Redistribute among auto goals (RLS ensures only user's goals)
  IF remaining_percentage > 0 AND total_auto_priority > 0 THEN
    FOR goal_record IN 
      SELECT id, name, priority_percentage
      FROM goals 
      WHERE manual_priority_override = FALSE AND is_completed = FALSE
    LOOP
      UPDATE goals 
      SET priority_percentage = ROUND(
        (goal_record.priority_percentage / total_auto_priority) * remaining_percentage, 
        2
      )
      WHERE id = goal_record.id;
      
      RETURN QUERY
      SELECT 
        goal_record.id,
        goal_record.name,
        goal_record.priority_percentage,
        ROUND((goal_record.priority_percentage / total_auto_priority) * remaining_percentage, 2),
        'auto_redistributed'::TEXT;
    END LOOP;
  END IF;
  
  -- Return manual goal change
  RETURN QUERY
  SELECT 
    manually_set_goal_id,
    (SELECT name FROM goals WHERE id = manually_set_goal_id),
    0::DECIMAL(8,4),
    new_priority_percentage,
    'manual_set'::TEXT;
END;
$function$;

CREATE OR REPLACE FUNCTION public.test_with_first_user()
 RETURNS TABLE(found_user_id uuid, user_email text, accounts_balance numeric, available_budget numeric)
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  first_user_id UUID;
  first_user_email TEXT;
  result_record RECORD;
BEGIN
  -- Get first user from auth.users who has accounts or goals
  SELECT u.id, u.email INTO first_user_id, first_user_email
  FROM auth.users u
  WHERE EXISTS (SELECT 1 FROM accounts WHERE user_id = u.id)
     OR EXISTS (SELECT 1 FROM goals WHERE user_id = u.id)
  LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    -- Get balance summary
    SELECT * INTO result_record 
    FROM update_user_balance_summary(first_user_id);
    
    RETURN QUERY
    SELECT 
      first_user_id,
      first_user_email,
      result_record.total_accounts_balance,
      result_record.available_budget;
  ELSE
    RAISE NOTICE 'No users found with accounts or goals';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.redistribute_priorities_with_due_dates(user_uuid uuid, manually_set_goal_id uuid, new_priority_percentage numeric, user_monthly_savings numeric)
 RETURNS TABLE(goal_id uuid, goal_name text, old_priority numeric, new_priority numeric, old_estimated_date date, new_estimated_date date, adjustment_type text)
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  total_manual_priority DECIMAL(8,4) := 0;
  remaining_percentage DECIMAL(8,4);
  total_auto_priority DECIMAL(8,4) := 0;
  goal_record RECORD;
  old_date DATE;
  new_date DATE;
BEGIN
  -- Ensure user is authenticated and can only access their own data
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF user_uuid != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only update own goals';
  END IF;
  
  -- Store old estimated date for the manually set goal
  SELECT timeline_date INTO old_date 
  FROM goals WHERE id = manually_set_goal_id;
  
  -- Set the manual priority for the specified goal
  UPDATE goals 
  SET 
    priority_percentage = new_priority_percentage,
    manual_priority_override = TRUE,
    updated_at = NOW()
  WHERE id = manually_set_goal_id;
  
  -- Calculate new estimated date for manually set goal
  SELECT calculate_estimated_completion_date(
    target, current_allocation, new_priority_percentage, user_monthly_savings
  ) INTO new_date
  FROM goals WHERE id = manually_set_goal_id;
  
  -- Update the estimated completion date
  UPDATE goals 
  SET timeline_date = COALESCE(new_date, timeline_date)
  WHERE id = manually_set_goal_id;
  
  -- Calculate remaining percentage and redistribute (same as before)
  SELECT COALESCE(SUM(priority_percentage), 0) INTO total_manual_priority
  FROM goals 
  WHERE user_id = user_uuid 
    AND manual_priority_override = TRUE
    AND current_allocation < target;
  
  remaining_percentage := 100.0 - total_manual_priority;
  
  SELECT COALESCE(SUM(priority_percentage), 0) INTO total_auto_priority
  FROM goals 
  WHERE user_id = user_uuid 
    AND manual_priority_override = FALSE
    AND current_allocation < target;
  
  -- Redistribute and update due dates for auto goals
  IF remaining_percentage > 0 AND total_auto_priority > 0 THEN
    FOR goal_record IN 
      SELECT id, name, priority_percentage, timeline_date, target, current_allocation
      FROM goals 
      WHERE user_id = user_uuid 
        AND manual_priority_override = FALSE
        AND current_allocation < target
    LOOP
      -- Store old date
      old_date := goal_record.timeline_date;
      
      -- Calculate new priority
      DECLARE
        new_auto_priority DECIMAL(8,4);
      BEGIN
        new_auto_priority := ROUND(
          (goal_record.priority_percentage / total_auto_priority) * remaining_percentage, 
          2
        );
        
        -- Calculate new estimated date
        new_date := calculate_estimated_completion_date(
          goal_record.target, 
          goal_record.current_allocation, 
          new_auto_priority, 
          user_monthly_savings
        );
        
        -- Update goal
        UPDATE goals 
        SET 
          priority_percentage = new_auto_priority,
          timeline_date = COALESCE(new_date, timeline_date),
          updated_at = NOW()
        WHERE id = goal_record.id;
        
        -- Return the change
        RETURN QUERY
        SELECT 
          goal_record.id,
          goal_record.name,
          goal_record.priority_percentage,
          new_auto_priority,
          old_date,
          new_date,
          'auto_redistributed'::TEXT;
      END;
    END LOOP;
  END IF;
  
  -- Return the manually set goal change
  RETURN QUERY
  SELECT 
    manually_set_goal_id,
    (SELECT name FROM goals WHERE id = manually_set_goal_id),
    (SELECT priority_percentage FROM goals WHERE id = manually_set_goal_id),
    new_priority_percentage,
    old_date,
    new_date,
    'manual_set'::TEXT;
END;
$function$;