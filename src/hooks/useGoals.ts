import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Goal {
  id: string;
  user_id: string;
  name: string;
  target: number;
  current_saved: number;
  monthly_allocation: number;
  priority: number | null;
  months_left: number;
  due_date: string | null;
  created_at: string;
  updated_at?: string;
}

interface TransformedGoal {
  id: string;
  name: string;
  target: number;
  progress: number;
  dueDate: string;
  priority: string;
  split: string;
  amountSaved: number;
  timeline: string;
  monthsLeft: number;
  monthlyAllocation: number;
  isComplete: boolean;
  createdAt: string;
}

// Calculate months left dynamically based on due_date
const calculateMonthsLeft = (dueDate: string | null): number => {
  if (!dueDate) return 1;
  const now = new Date();
  const due = new Date(dueDate);
  const monthsDiff = (due.getFullYear() - now.getFullYear()) * 12 +
                     (due.getMonth() - now.getMonth());
  return Math.max(1, monthsDiff); // Minimum 1 month
};

// Calculate weight for each goal: (Target - CurrentSaved) / MonthsLeft²
const calculateWeight = (target: number, currentSaved: number, monthsLeft: number): number => {
  const remaining = target - currentSaved;
  if (remaining <= 0) return 0; // Completed goals have 0 weight
  return remaining / Math.pow(monthsLeft, 2);
};

function transformGoals(data: Goal[] | null): TransformedGoal[] {
  if (!data || data.length === 0) return [];

  const totalSaved = data.reduce((sum, goal) => sum + (goal.current_saved || 0), 0);

  const goalsWithWeights = data.map(goal => {
    const monthsLeft = calculateMonthsLeft(goal.due_date);
    const isComplete = goal.current_saved >= goal.target;
    const weight = isComplete ? 0 : calculateWeight(goal.target, goal.current_saved, monthsLeft);
    return { goal, monthsLeft, isComplete, weight };
  });

  const totalWeight = goalsWithWeights.reduce((sum, { weight }) => sum + weight, 0);

  return goalsWithWeights.map(({ goal, monthsLeft, isComplete, weight }) => {
    const progress = goal.target > 0 ? Math.round((goal.current_saved / goal.target) * 100) : 0;
    const split = totalSaved > 0 ? ((goal.current_saved / totalSaved) * 100).toFixed(1) : '0.0';
    const priorityPercentage = isComplete ? 0 : (totalWeight > 0 ? (weight / totalWeight) * 100 : 0);
    const monthlyAllocation = isComplete ? 0 : (goal.monthly_allocation || 0);

    const formattedDueDate = goal.due_date
      ? new Date(goal.due_date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: '2-digit'
        }).replace(/ /g, ' ')
      : 'No date set';

    return {
      id: goal.id,
      name: goal.name,
      target: goal.target,
      progress,
      dueDate: `Est completion date: ${formattedDueDate}`,
      priority: `${priorityPercentage.toFixed(2)}%`,
      split: `${split}%`,
      amountSaved: goal.current_saved,
      timeline: formattedDueDate,
      monthsLeft,
      monthlyAllocation,
      isComplete,
      createdAt: goal.created_at,
    };
  });
}

async function fetchGoalsFromSupabase(): Promise<TransformedGoal[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await (supabase as any)
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as { data: Goal[] | null; error: any };

  if (error) throw error;
  return transformGoals(data);
}

const GOALS_QUERY_KEY = ['goals'];

export const useGoals = () => {
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: GOALS_QUERY_KEY,
    queryFn: fetchGoalsFromSupabase,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
  }, [queryClient]);

  const error = queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null;

  const addGoal = async (goalData: {
    name: string;
    target: number;
    currentSaved?: number;
    monthlyAllocation?: number;
    dueDate: Date;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const dueDate = new Date(goalData.dueDate);
    const monthsDiff = (dueDate.getFullYear() - now.getFullYear()) * 12 + (dueDate.getMonth() - now.getMonth());
    const monthsLeft = Math.max(1, monthsDiff);

    const { error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        name: goalData.name,
        target: goalData.target,
        current_saved: goalData.currentSaved || 0,
        monthly_allocation: goalData.monthlyAllocation || 0,
        due_date: goalData.dueDate.toISOString().split('T')[0],
        months_left: monthsLeft,
      });

    if (error) throw error;
    invalidate();
  };

  const updateGoal = async (goalId: string, goalData: {
    name: string;
    target: number;
    currentSaved?: number;
    monthlyAllocation?: number;
    dueDate: Date;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const dueDate = new Date(goalData.dueDate);
    const monthsDiff = (dueDate.getFullYear() - now.getFullYear()) * 12 + (dueDate.getMonth() - now.getMonth());
    const monthsLeft = Math.max(1, monthsDiff);

    const { error } = await supabase
      .from('goals')
      .update({
        name: goalData.name,
        target: goalData.target,
        current_saved: goalData.currentSaved || 0,
        monthly_allocation: goalData.monthlyAllocation || 0,
        due_date: goalData.dueDate.toISOString().split('T')[0],
        months_left: monthsLeft,
      })
      .eq('id', goalId);

    if (error) throw error;
    invalidate();
  };

  const deleteGoal = async (goalId: string) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;
    invalidate();
  };

  return { goals, loading, error, addGoal, updateGoal, deleteGoal };
};
