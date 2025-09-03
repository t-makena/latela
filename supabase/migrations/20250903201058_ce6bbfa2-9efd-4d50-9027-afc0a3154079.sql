-- Fix all remaining functions to set search_path for security
-- This addresses the search_path mutable warnings

CREATE OR REPLACE FUNCTION public.calculate_priority_weight(remaining_amount numeric, months_remaining integer)
 RETURNS numeric
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF remaining_amount > 0 AND months_remaining > 0 THEN
    RETURN remaining_amount / POWER(months_remaining, 2);
  ELSE
    RETURN 0;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_source_totals()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    -- Update the total for the affected source
    UPDATE source_list 
    SET total = (
        SELECT COALESCE(SUM(ABS(value)), 0) 
        FROM transactions 
        WHERE transactions.source = source_list.Entity
    )
    WHERE Entity = COALESCE(NEW.source, OLD.source);
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_estimated_completion_date(target_amount numeric, current_allocation numeric, monthly_priority_percentage numeric, user_monthly_savings numeric)
 RETURNS date
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  remaining_needed DECIMAL(12,2);
  monthly_allocation DECIMAL(12,2);
  months_needed INTEGER;
BEGIN
  remaining_needed := GREATEST(target_amount - current_allocation, 0);
  
  IF remaining_needed <= 0 THEN
    RETURN CURRENT_DATE; -- Already completed
  END IF;
  
  monthly_allocation := (monthly_priority_percentage / 100) * user_monthly_savings;
  
  IF monthly_allocation <= 0 THEN
    RETURN NULL; -- Cannot complete with 0 monthly allocation
  END IF;
  
  months_needed := CEIL(remaining_needed / monthly_allocation);
  
  RETURN CURRENT_DATE + (months_needed || ' months')::INTERVAL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_priority_percentages(user_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  total_weight DECIMAL(12,4) := 0;
  goal_record RECORD;
BEGIN
  -- First calculate individual weights for all active goals
  FOR goal_record IN 
    SELECT id, target, split_percentage, timeline_date
    FROM goals 
    WHERE user_id = user_uuid AND current_allocation < target
  LOOP
    -- Calculate months left
    UPDATE goals 
    SET months_left = GREATEST(
      EXTRACT(YEAR FROM AGE(timeline_date, CURRENT_DATE)) * 12 + 
      EXTRACT(MONTH FROM AGE(timeline_date, CURRENT_DATE)), 
      1
    ),
    priority_weight = (target * (split_percentage/100)) / POWER(GREATEST(
      EXTRACT(YEAR FROM AGE(timeline_date, CURRENT_DATE)) * 12 + 
      EXTRACT(MONTH FROM AGE(timeline_date, CURRENT_DATE)), 
      1
    ), 2)
    WHERE id = goal_record.id;
  END LOOP;
  
  -- Get total weight
  SELECT COALESCE(SUM(priority_weight), 0) INTO total_weight
  FROM goals WHERE user_id = user_uuid AND current_allocation < target;
  
  -- Calculate priority percentages
  IF total_weight > 0 THEN
    UPDATE goals 
    SET priority_percentage = ROUND((priority_weight / total_weight) * 100, 2)
    WHERE user_id = user_uuid AND current_allocation < target;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_balance_on_goal_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get the user_id from the row being changed
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;
  
  -- Update balance summary with explicit user_id
  PERFORM update_user_balance_summary(target_user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_update_due_dates()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  user_monthly_savings DECIMAL(12,2);
BEGIN
  -- Get user's monthly savings amount (you'll need to store this somewhere)
  -- For now, assuming you have a user_settings table
  SELECT monthly_savings_budget INTO user_monthly_savings
  FROM user_settings 
  WHERE user_id = NEW.user_id;
  
  -- If we have the monthly savings info, recalculate due date
  IF user_monthly_savings IS NOT NULL AND user_monthly_savings > 0 THEN
    NEW.timeline_date := calculate_estimated_completion_date(
      NEW.target,
      NEW.current_allocation,
      NEW.priority_percentage,
      user_monthly_savings
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.redistribute_priorities_after_manual_set(user_uuid uuid, manually_set_goal_id uuid, new_priority_percentage numeric)
 RETURNS TABLE(goal_id uuid, goal_name text, old_priority numeric, new_priority numeric, adjustment_type text)
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  total_manual_priority DECIMAL(8,4) := 0;
  remaining_percentage DECIMAL(8,4);
  total_auto_priority DECIMAL(8,4) := 0;
  goal_record RECORD;
BEGIN
  -- First, set the manual priority for the specified goal
  UPDATE goals 
  SET 
    priority_percentage = new_priority_percentage,
    manual_priority_override = TRUE,
    updated_at = NOW()
  WHERE id = manually_set_goal_id;
  
  -- Calculate total manually set priorities
  SELECT COALESCE(SUM(priority_percentage), 0) INTO total_manual_priority
  FROM goals 
  WHERE user_id = user_uuid 
    AND manual_priority_override = TRUE
    AND current_allocation < target;
  
  -- Calculate remaining percentage available for auto-calculation
  remaining_percentage := 100.0 - total_manual_priority;
  
  -- Get total of current auto-calculated priorities (to calculate proportions)
  SELECT COALESCE(SUM(priority_percentage), 0) INTO total_auto_priority
  FROM goals 
  WHERE user_id = user_uuid 
    AND manual_priority_override = FALSE
    AND current_allocation < target;
  
  -- If there's remaining percentage and auto goals exist
  IF remaining_percentage > 0 AND total_auto_priority > 0 THEN
    -- Redistribute proportionally among non-manual goals
    FOR goal_record IN 
      SELECT id, name, priority_percentage
      FROM goals 
      WHERE user_id = user_uuid 
        AND manual_priority_override = FALSE
        AND current_allocation < target
    LOOP
      -- Calculate new priority as proportion of remaining percentage
      UPDATE goals 
      SET 
        priority_percentage = ROUND(
          (goal_record.priority_percentage / total_auto_priority) * remaining_percentage, 
          2
        ),
        updated_at = NOW()
      WHERE id = goal_record.id;
      
      -- Return the change
      RETURN QUERY
      SELECT 
        goal_record.id,
        goal_record.name,
        goal_record.priority_percentage,
        ROUND((goal_record.priority_percentage / total_auto_priority) * remaining_percentage, 2),
        'auto_redistributed'::TEXT;
    END LOOP;
  END IF;
  
  -- Return the manually set goal change
  RETURN QUERY
  SELECT 
    manually_set_goal_id,
    (SELECT name FROM goals WHERE id = manually_set_goal_id),
    (SELECT priority_percentage FROM goals WHERE id = manually_set_goal_id AND updated_at < NOW() - INTERVAL '1 second'),
    new_priority_percentage,
    'manual_set'::TEXT;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_balance_on_account_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get the user_id from the row being changed
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;
  
  -- Only trigger if balance or budget inclusion changed
  IF TG_OP = 'DELETE' OR 
     TG_OP = 'INSERT' OR 
     (TG_OP = 'UPDATE' AND (
       OLD.balance != NEW.balance OR 
       OLD.is_active != NEW.is_active OR 
       OLD.include_in_budget != NEW.include_in_budget
     )) THEN
    -- Pass the user_id to the function
    PERFORM update_user_balance_summary(target_user_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_account_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE accounts 
    SET balance = balance + 
      CASE 
        WHEN NEW.type = 'income' THEN NEW.amount
        WHEN NEW.type = 'expense' THEN -NEW.amount
        ELSE 0
      END,
      updated_at = NOW()
    WHERE id = NEW.account_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    -- Reverse old transaction
    UPDATE accounts 
    SET balance = balance - 
      CASE 
        WHEN OLD.type = 'income' THEN OLD.amount
        WHEN OLD.type = 'expense' THEN -OLD.amount
        ELSE 0
      END
    WHERE id = OLD.account_id;
    
    -- Apply new transaction
    UPDATE accounts 
    SET balance = balance + 
      CASE 
        WHEN NEW.type = 'income' THEN NEW.amount
        WHEN NEW.type = 'expense' THEN -NEW.amount
        ELSE 0
      END,
      updated_at = NOW()
    WHERE id = NEW.account_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE accounts 
    SET balance = balance - 
      CASE 
        WHEN OLD.type = 'income' THEN OLD.amount
        WHEN OLD.type = 'expense' THEN -OLD.amount
        ELSE 0
      END,
      updated_at = NOW()
    WHERE id = OLD.account_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_goal_calculations()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  user_monthly_savings DECIMAL(12,2);
BEGIN
  -- Calculate months left (this replaces the generated column)
  NEW.months_left = GREATEST(
    EXTRACT(YEAR FROM AGE(NEW.timeline_date, CURRENT_DATE)) * 12 + 
    EXTRACT(MONTH FROM AGE(NEW.timeline_date, CURRENT_DATE)),
    1
  );
  
  -- Get user's monthly savings budget
  SELECT COALESCE(monthly_savings_budget, 0) INTO user_monthly_savings
  FROM user_settings 
  WHERE user_id = NEW.user_id;
  
  -- Update priority weight using remaining amount and months left
  NEW.priority_weight = CASE 
    WHEN NEW.months_left > 0 AND (NEW.target - NEW.current_allocation) > 0
    THEN (NEW.target - NEW.current_allocation) / POWER(NEW.months_left, 2)
    ELSE 0 
  END;
  
  -- Calculate monthly allocation amount
  IF user_monthly_savings > 0 THEN
    NEW.monthly_allocation = ROUND((NEW.priority_percentage / 100) * user_monthly_savings, 2);
    
    -- Calculate estimated completion months
    IF NEW.monthly_allocation > 0 AND NEW.current_allocation < NEW.target THEN
      NEW.estimated_completion_months = CEIL(
        (NEW.target - NEW.current_allocation) / NEW.monthly_allocation
      );
    ELSE
      NEW.estimated_completion_months = NULL;
    END IF;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;