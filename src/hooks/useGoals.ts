import { useState, useEffect, useCallback } from 'react';
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

export const useGoals = () => {
  const [goals, setGoals] = useState<TransformedGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformGoals = useCallback((data: Goal[] | null): TransformedGoal[] => {
    if (!data || data.length === 0) return [];

    // Calculate total saved across all goals for split calculation
    const totalSaved = data.reduce((sum, goal) => sum + (goal.current_saved || 0), 0);

    // Calculate weights for active goals only (used for priority percentage)
    const goalsWithWeights = data.map(goal => {
      const monthsLeft = calculateMonthsLeft(goal.due_date);
      const isComplete = goal.current_saved >= goal.target;
      const weight = isComplete ? 0 : calculateWeight(goal.target, goal.current_saved, monthsLeft);
      return { goal, monthsLeft, isComplete, weight };
    });

    // Calculate total weight for priority percentage calculation
    const totalWeight = goalsWithWeights.reduce((sum, { weight }) => sum + weight, 0);

    // Transform the data with calculated priorities
    return goalsWithWeights.map(({ goal, monthsLeft, isComplete, weight }) => {
      const progress = goal.target > 0 ? Math.round((goal.current_saved / goal.target) * 100) : 0;
      const split = totalSaved > 0 ? ((goal.current_saved / totalSaved) * 100).toFixed(1) : '0.0';
      
      // Calculate priority percentage based on deadline-weighted formula (kept for internal use)
      const priorityPercentage = isComplete ? 0 : (totalWeight > 0 ? (weight / totalWeight) * 100 : 0);
      
      // Use user-specified monthly allocation from database
      const monthlyAllocation = isComplete ? 0 : (goal.monthly_allocation || 0);
      
      // Format due date
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
        dueDate: `Due: ${formattedDueDate}`,
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
  }, []);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setGoals([]);
        setLoading(false);
        return;
      }

      const { data, error } = await (supabase as any)
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as { data: Goal[] | null; error: any };

      if (error) {
        throw error;
      }

      const transformedGoals = transformGoals(data);
      setGoals(transformedGoals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  }, [transformGoals]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = async (goalData: {
    name: string;
    target: number;
    currentSaved?: number;
    monthlyAllocation?: number;
    dueDate: Date;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Calculate months_left from due date
      const now = new Date();
      const dueDate = new Date(goalData.dueDate);
      const monthsDiff = (dueDate.getFullYear() - now.getFullYear()) * 12 + (dueDate.getMonth() - now.getMonth());
      const monthsLeft = Math.max(1, monthsDiff); // At least 1 month

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

      // Refetch goals after adding
      await fetchGoals();
    } catch (err) {
      console.error('Error adding goal:', err);
      throw err;
    }
  };

  const updateGoal = async (goalId: string, goalData: {
    name: string;
    target: number;
    currentSaved?: number;
    monthlyAllocation?: number;
    dueDate: Date;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Calculate months_left from due date
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

      await fetchGoals();
    } catch (err) {
      console.error('Error updating goal:', err);
      throw err;
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== goalId));
    } catch (err) {
      console.error('Error deleting goal:', err);
      throw err;
    }
  };

  return { goals, loading, error, addGoal, updateGoal, deleteGoal };
};
