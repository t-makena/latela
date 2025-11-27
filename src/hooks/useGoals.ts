import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Goal {
  id: string;
  user_id: string;
  name: string;
  target: number;
  current_saved: number;
  priority: number | null;
  months_left: number;
  created_at: string;
  updated_at?: string;
}

interface TransformedGoal {
  id: string;
  name: string;
  progress: number;
  dueDate: string;
  priority: string;
  split: string;
  amountSaved: number;
  timeline: string;
}

export const useGoals = () => {
  const [goals, setGoals] = useState<TransformedGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGoals = async () => {
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

        // Calculate total saved across all goals
        const totalSaved = (data || []).reduce((sum, goal) => sum + (goal.current_saved || 0), 0);

        // Transform the data
        const transformedGoals: TransformedGoal[] = (data || []).map((goal) => {
          const progress = goal.target > 0 ? Math.round((goal.current_saved / goal.target) * 100) : 0;
          const split = totalSaved > 0 ? ((goal.current_saved / totalSaved) * 100).toFixed(1) : '0.0';
          const priority = goal.priority ? `${goal.priority.toFixed(2)}%` : '0.00%';
          
          // Calculate due date based on months_left
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + (goal.months_left || 0));
          const formattedDueDate = dueDate.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: '2-digit' 
          }).replace(/ /g, ' ');
          
          return {
            id: goal.id,
            name: goal.name,
            progress,
            dueDate: `Due: ${formattedDueDate}`,
            priority,
            split: `${split}%`,
            amountSaved: goal.current_saved,
            timeline: formattedDueDate,
          };
        });

        setGoals(transformedGoals);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching goals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const addGoal = async (goalData: {
    name: string;
    target: number;
    currentSaved?: number;
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
          months_left: monthsLeft,
        });

      if (error) throw error;

      // Refetch goals after adding
      const { data } = await (supabase as any)
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as { data: Goal[] | null; error: any };

      if (data) {
        const totalSaved = data.reduce((sum, goal) => sum + (goal.current_saved || 0), 0);
        const transformedGoals: TransformedGoal[] = data.map((goal) => {
          const progress = goal.target > 0 ? Math.round((goal.current_saved / goal.target) * 100) : 0;
          const split = totalSaved > 0 ? ((goal.current_saved / totalSaved) * 100).toFixed(1) : '0.0';
          const priority = goal.priority ? `${goal.priority.toFixed(2)}%` : '0.00%';
          
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + (goal.months_left || 0));
          const formattedDueDate = dueDate.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: '2-digit' 
          }).replace(/ /g, ' ');
          
          return {
            id: goal.id,
            name: goal.name,
            progress,
            dueDate: `Due: ${formattedDueDate}`,
            priority,
            split: `${split}%`,
            amountSaved: goal.current_saved,
            timeline: formattedDueDate,
          };
        });
        setGoals(transformedGoals);
      }
    } catch (err) {
      console.error('Error adding goal:', err);
      throw err;
    }
  };

  return { goals, loading, error, addGoal };
};
