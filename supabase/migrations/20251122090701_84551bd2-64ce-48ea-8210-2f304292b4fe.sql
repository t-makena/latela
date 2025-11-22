-- Fix SECURITY DEFINER view by adding user filtering
DROP VIEW IF EXISTS upcoming_events_summary;

CREATE VIEW upcoming_events_summary 
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  COUNT(*) as event_count,
  SUM(budgeted_amount) as total_budget_next_30_days
FROM calendar_events
WHERE event_date >= CURRENT_DATE 
  AND event_date <= CURRENT_DATE + INTERVAL '30 days'
GROUP BY user_id;

-- Fix search_path for existing functions
ALTER FUNCTION allocate_monthly_savings(user_uuid uuid, monthly_savings numeric) SET search_path = public, pg_temp;
ALTER FUNCTION recalculate_goal_priorities(user_uuid uuid) SET search_path = public, pg_temp;
ALTER FUNCTION recalculate_goal_priorities_and_dates(user_uuid uuid) SET search_path = public, pg_temp;
ALTER FUNCTION redistribute_priorities_for_user(manually_set_goal_id uuid, new_priority_percentage numeric) SET search_path = public, pg_temp;
ALTER FUNCTION update_goal_current_allocation(goal_id uuid, new_allocation numeric) SET search_path = public, pg_temp;
ALTER FUNCTION update_calendar_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION update_goal_calculations() SET search_path = public, pg_temp;