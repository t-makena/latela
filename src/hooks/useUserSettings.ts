import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SavingsAdjustmentStrategy = 'inverse_priority' | 'proportional' | 'even_distribution';

interface UserSettings {
  id: string;
  user_id: string;
  savings_adjustment_strategy: SavingsAdjustmentStrategy;
  created_at: string;
  updated_at: string;
}

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSettings(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as UserSettings);
      } else {
        // Create default settings if none exist
        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            savings_adjustment_strategy: 'inverse_priority'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings as UserSettings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching user settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSavingsStrategy = async (strategy: SavingsAdjustmentStrategy) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_settings')
        .update({ savings_adjustment_strategy: strategy })
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, savings_adjustment_strategy: strategy } : null);
      return true;
    } catch (err) {
      console.error('Error updating savings strategy:', err);
      throw err;
    }
  };

  return {
    settings,
    loading,
    error,
    savingsAdjustmentStrategy: settings?.savings_adjustment_strategy || 'inverse_priority',
    updateSavingsStrategy,
    refetch: fetchSettings,
  };
};
