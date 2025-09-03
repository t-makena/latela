-- Fix SECURITY DEFINER functions to prevent cross-user data access
-- Update functions to use auth.uid() properly and set search_path

-- 1. Fix get_user_accounts_summary to be more secure
CREATE OR REPLACE FUNCTION public.get_user_accounts_summary()
 RETURNS TABLE(account_id uuid, account_name text, account_type text, balance_formatted text, bank_name text, is_active boolean, include_in_budget boolean, currency text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.type,
    a.currency || ' ' || TO_CHAR(a.balance, 'FM999,999,999.00'),
    a.bank_name,
    a.is_active,
    a.include_in_budget,
    a.currency
  FROM accounts a
  WHERE a.user_id = auth.uid()
  ORDER BY a.is_active DESC, a.balance DESC;
END;
$function$;

-- 2. Fix get_user_goals_display to be more secure
CREATE OR REPLACE FUNCTION public.get_user_goals_display(user_uuid uuid DEFAULT auth.uid())
 RETURNS TABLE(goal_id uuid, goal text, priority text, split text, timeline text, achieved text, target numeric, current_allocation numeric, remaining_needed numeric, is_completed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Ensure user is authenticated and can only access their own data
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Only allow users to access their own data
  IF user_uuid != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only access own goals';
  END IF;
  
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    CONCAT(ROUND(g.priority_percentage, 1), '%'),
    CONCAT(ROUND(g.split_percentage, 1), '%'),
    TO_CHAR(g.timeline_date, 'DD Mon YY'),
    CONCAT(ROUND(g.percentage_achieved, 1), '%'),
    g.target,
    g.current_allocation,
    g.remaining_needed,
    g.is_completed
  FROM goals g
  WHERE g.user_id = auth.uid()
  ORDER BY g.priority_percentage DESC;
END;
$function$;

-- 3. Fix update_user_balance_summary to be more secure
CREATE OR REPLACE FUNCTION public.update_user_balance_summary(target_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(total_accounts_balance numeric, goal_allocations numeric, calendar_events numeric, available_budget numeric, progress numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  user_uuid UUID;
  accounts_total DECIMAL(15,2) := 0;
  goals_allocated DECIMAL(12,2) := 0;
  goals_target DECIMAL(12,2) := 0;
  goals_remaining DECIMAL(12,2) := 0;
  calendar_total DECIMAL(12,2) := 0;
  active_goals INTEGER := 0;
  completed_goals INTEGER := 0;
  upcoming_events INTEGER := 0;
  next_event_date DATE := NULL;
  next_event_cost DECIMAL(12,2) := 0;
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- If target_user_id is provided, ensure user can only access their own data
  IF target_user_id IS NOT NULL AND target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only access own balance summary';
  END IF;
  
  -- Use authenticated user's ID
  user_uuid := auth.uid();
  
  -- Get accounts balances total for authenticated user only
  SELECT COALESCE(SUM(balance), 0) INTO accounts_total
  FROM accounts 
  WHERE user_id = user_uuid AND is_active = TRUE AND include_in_budget = TRUE;
  
  -- Get goals summary for authenticated user only
  SELECT 
    COALESCE(SUM(current_allocation), 0),
    COALESCE(SUM(target), 0),
    COALESCE(SUM(remaining_needed), 0),
    COUNT(*) FILTER (WHERE is_completed = FALSE),
    COUNT(*) FILTER (WHERE is_completed = TRUE)
  INTO goals_allocated, goals_target, goals_remaining, active_goals, completed_goals
  FROM goals
  WHERE user_id = user_uuid;
  
  -- Get calendar events total for authenticated user only
  BEGIN
    SELECT 
      COALESCE(SUM(estimated_cost), 0),
      COUNT(*)
    INTO calendar_total, upcoming_events
    FROM calendar_events 
    WHERE user_id = user_uuid AND event_date >= CURRENT_DATE AND is_completed = FALSE;
    
    -- Get next upcoming event for authenticated user only
    SELECT event_date, estimated_cost 
    INTO next_event_date, next_event_cost
    FROM calendar_events 
    WHERE user_id = user_uuid AND event_date >= CURRENT_DATE AND is_completed = FALSE
    ORDER BY event_date ASC
    LIMIT 1;
    
  EXCEPTION 
    WHEN undefined_table THEN
      calendar_total := 0;
      upcoming_events := 0;
      next_event_date := NULL;
      next_event_cost := 0;
  END;
  
  -- Ensure next_event_cost is not null
  next_event_cost := COALESCE(next_event_cost, 0);
  
  -- Upsert balance summary for authenticated user only
  INSERT INTO user_balance_summary (
    user_id,
    total_bank_account_balance,
    total_allocated_to_goals,
    total_calendar_events,
    total_goals_target,
    total_goals_remaining,
    active_goals_count,
    completed_goals_count,
    upcoming_events_count,
    next_event_date,
    next_event_amount,
    last_calculated
  ) VALUES (
    user_uuid,
    accounts_total,
    goals_allocated,
    calendar_total,
    goals_target,
    goals_remaining,
    active_goals,
    completed_goals,
    upcoming_events,
    next_event_date,
    next_event_cost,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_bank_account_balance = EXCLUDED.total_bank_account_balance,
    total_allocated_to_goals = EXCLUDED.total_allocated_to_goals,
    total_calendar_events = EXCLUDED.total_calendar_events,
    total_goals_target = EXCLUDED.total_goals_target,
    total_goals_remaining = EXCLUDED.total_goals_remaining,
    active_goals_count = EXCLUDED.active_goals_count,
    completed_goals_count = EXCLUDED.completed_goals_count,
    upcoming_events_count = EXCLUDED.upcoming_events_count,
    next_event_date = EXCLUDED.next_event_date,
    next_event_amount = EXCLUDED.next_event_amount,
    last_calculated = NOW(),
    last_updated = NOW();
  
  -- Return the calculated values for authenticated user only
  RETURN QUERY
  SELECT 
    ubs.total_bank_account_balance,
    ubs.total_allocated_to_goals,
    ubs.total_calendar_events,
    ubs.available_budget_balance,
    ubs.overall_savings_progress
  FROM user_balance_summary ubs
  WHERE ubs.user_id = user_uuid;
END;
$function$;

-- 4. Fix other security definer functions to enforce proper access control
CREATE OR REPLACE FUNCTION public.get_total_available_balance(p_user_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Only allow users to access their own balance
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only access own balance';
  END IF;
  
  RETURN (
    SELECT COALESCE(SUM(available_balance), 0)
    FROM accounts 
    WHERE user_id = auth.uid()
      AND is_active = TRUE
      AND available_balance IS NOT NULL
  );
END;
$function$;

-- 5. Fix get_total_goals_target function
CREATE OR REPLACE FUNCTION public.get_total_goals_target(p_user_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Only allow users to access their own goals target
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only access own goals';
  END IF;
  
  RETURN (
    SELECT COALESCE(SUM(target_amount - current_amount), 0)
    FROM goals 
    WHERE user_id = auth.uid()
      AND is_achieved = FALSE
      AND (target_amount - current_amount) > 0
  );
END;
$function$;

-- 6. Fix get_upcoming_events_total function
CREATE OR REPLACE FUNCTION public.get_upcoming_events_total(p_user_id uuid, p_date_range integer DEFAULT 30)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Only allow users to access their own events
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only access own events';
  END IF;
  
  RETURN (
    SELECT COALESCE(SUM(estimated_budget), 0)
    FROM events 
    WHERE user_id = auth.uid()
      AND is_completed = FALSE 
      AND event_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '1 day' * p_date_range)
  );
END;
$function$;