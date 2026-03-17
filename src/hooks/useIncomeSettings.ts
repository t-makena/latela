import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type IncomeFrequency = 'monthly' | 'bi-weekly' | 'weekly';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const useIncomeSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const migrationDone = useRef(false);

  // Fetch settings from Supabase
  const { data: settings, isLoading } = useQuery({
    queryKey: ['incomeSettings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_or_create_user_settings');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 300000,
  });

  // Mutation for updating settings
  const updateMutation = useMutation({
    mutationFn: async (params: {
      income_amount_cents: number;
      income_frequency: string;
      payday: number;
      income_sources: any;
    }) => {
      const { data, error } = await supabase.rpc('update_income_settings', {
        p_income_amount_cents: params.income_amount_cents,
        p_income_frequency: params.income_frequency,
        p_payday: params.payday,
        p_income_sources: params.income_sources,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeSettings', user?.id] });
    },
  });

  // One-time migration from localStorage
  useEffect(() => {
    if (!settings || !user || migrationDone.current) return;
    migrationDone.current = true;

    // Check if Supabase has no income data but localStorage does
    if ((settings as any)?.income_amount_cents === 0 || (settings as any)?.income_amount_cents === null) {
      const localPayday = localStorage.getItem('userPayday');
      const localFreq = localStorage.getItem('incomeFrequency');
      if (localPayday || localFreq) {
        const paydayVal = localPayday ? parseInt(localPayday, 10) : 25;
        const freqVal = (localFreq as IncomeFrequency) || 'monthly';
        updateMutation.mutate({
          income_amount_cents: 0,
          income_frequency: freqVal,
          payday: paydayVal,
          income_sources: JSON.stringify([]),
        });
        // Clear old localStorage keys
        localStorage.removeItem('userPayday');
        localStorage.removeItem('incomeFrequency');
        localStorage.removeItem('weeklyPayday');
        localStorage.removeItem('biweeklyPayday1');
        localStorage.removeItem('biweeklyPayday2');
      }
    }
  }, [settings, user]);

  // Derived values from settings
  const payday = (settings as any)?.payday ?? (settings as any)?.payday_date ?? 25;
  const frequency: IncomeFrequency = ((settings as any)?.income_frequency as IncomeFrequency) || 'monthly';
  const weeklyPayday = 5; // Default Friday — stored in payday field for weekly
  const biweeklyPayday1 = 1;
  const biweeklyPayday2 = 15;

  const updatePayday = useCallback((day: number) => {
    const validDay = Math.max(1, Math.min(31, day));
    updateMutation.mutate({
      income_amount_cents: (settings as any)?.income_amount_cents ?? 0,
      income_frequency: (settings as any)?.income_frequency ?? 'monthly',
      payday: validDay,
      income_sources: JSON.stringify((settings as any)?.income_sources ?? []),
    });
  }, [settings, updateMutation]);

  const updateFrequency = useCallback((freq: IncomeFrequency) => {
    updateMutation.mutate({
      income_amount_cents: (settings as any)?.income_amount_cents ?? 0,
      income_frequency: freq,
      payday: (settings as any)?.payday ?? 25,
      income_sources: JSON.stringify((settings as any)?.income_sources ?? []),
    });
  }, [settings, updateMutation]);

  const updateWeeklyPayday = useCallback((_day: number) => {
    // Weekly payday stored via the payday field
    updatePayday(_day);
  }, [updatePayday]);

  const updateBiweeklyPayday1 = useCallback((_day: number) => {
    // For bi-weekly, use the payday field for first date
    updatePayday(_day);
  }, [updatePayday]);

  const updateBiweeklyPayday2 = useCallback((_day: number) => {
    // Currently not separately stored — uses payday field
    updatePayday(_day);
  }, [updatePayday]);

  // Helper to get the next payday from a given date
  const getNextPayday = useCallback((fromDate: Date): Date => {
    const today = new Date(fromDate);
    today.setHours(0, 0, 0, 0);

    if (frequency === 'weekly') {
      const currentDay = today.getDay();
      let daysUntilPayday = (weeklyPayday - currentDay + 7) % 7;
      if (daysUntilPayday === 0) daysUntilPayday = 7;
      const nextPayday = new Date(today);
      nextPayday.setDate(today.getDate() + daysUntilPayday);
      return nextPayday;
    } else if (frequency === 'bi-weekly') {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const payday1ThisMonth = new Date(currentYear, currentMonth, biweeklyPayday1);
      const payday2ThisMonth = new Date(currentYear, currentMonth, biweeklyPayday2);

      const [firstPayday, secondPayday] = biweeklyPayday1 < biweeklyPayday2 
        ? [payday1ThisMonth, payday2ThisMonth] 
        : [payday2ThisMonth, payday1ThisMonth];

      if (today < firstPayday) return firstPayday;
      if (today < secondPayday) return secondPayday;

      const nextMonth = currentMonth + 1;
      const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
      const adjustedMonth = nextMonth % 12;
      const smallerPayday = Math.min(biweeklyPayday1, biweeklyPayday2);
      return new Date(nextYear, adjustedMonth, smallerPayday);
    } else {
      const nextPaydayDate = new Date(today);
      nextPaydayDate.setDate(payday);
      if (nextPaydayDate <= today) {
        nextPaydayDate.setMonth(nextPaydayDate.getMonth() + 1);
      }
      return nextPaydayDate;
    }
  }, [frequency, payday, weeklyPayday, biweeklyPayday1, biweeklyPayday2]);

  // Get the Nth payday from today
  const getNthPayday = useCallback((periodsFromNow: number): Date => {
    if (periodsFromNow <= 0) return new Date();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (frequency === 'weekly') {
      let payDate = getNextPayday(today);
      payDate.setDate(payDate.getDate() + (periodsFromNow - 1) * 7);
      return payDate;
    } else if (frequency === 'bi-weekly') {
      const paydays: Date[] = [];
      let currentMonth = today.getMonth();
      let currentYear = today.getFullYear();
      
      while (paydays.length < periodsFromNow) {
        const p1 = new Date(currentYear, currentMonth, biweeklyPayday1);
        const p2 = new Date(currentYear, currentMonth, biweeklyPayday2);
        
        if (p1 > today) paydays.push(p1);
        if (p2 > today) paydays.push(p2);
        paydays.sort((a, b) => a.getTime() - b.getTime());
        
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      }
      
      return paydays[periodsFromNow - 1];
    } else {
      let payDate = getNextPayday(today);
      payDate.setMonth(payDate.getMonth() + (periodsFromNow - 1));
      return payDate;
    }
  }, [frequency, getNextPayday, biweeklyPayday1, biweeklyPayday2]);

  // Count pay periods between now and a target date
  const countPayPeriods = useCallback((targetDate: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    const firstPayday = getNextPayday(today);
    if (target < firstPayday) return 0;

    if (frequency === 'weekly') {
      let count = 0;
      let currentPayday = new Date(firstPayday);
      while (currentPayday <= target) { count++; currentPayday.setDate(currentPayday.getDate() + 7); }
      return count;
    } else if (frequency === 'bi-weekly') {
      let count = 0;
      let currentMonth = firstPayday.getMonth();
      let currentYear = firstPayday.getFullYear();
      
      while (true) {
        const p1 = new Date(currentYear, currentMonth, biweeklyPayday1);
        const p2 = new Date(currentYear, currentMonth, biweeklyPayday2);
        
        if (p1 > today && p1 <= target) count++;
        if (p2 > today && p2 <= target) count++;
        
        const maxPayday = Math.max(biweeklyPayday1, biweeklyPayday2);
        if (new Date(currentYear, currentMonth, maxPayday) > target) break;
        
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      }
      return count;
    } else {
      let count = 0;
      let currentPayday = new Date(firstPayday);
      while (currentPayday <= target) { count++; currentPayday.setMonth(currentPayday.getMonth() + 1); }
      return count;
    }
  }, [frequency, getNextPayday, biweeklyPayday1, biweeklyPayday2]);

  const getFrequencyLabel = useCallback((): string => {
    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'bi-weekly': return 'Bi-weekly';
      default: return 'Monthly';
    }
  }, [frequency]);

  const getPeriodTerm = useCallback((count: number): string => {
    switch (frequency) {
      case 'weekly': return count === 1 ? 'week' : 'weeks';
      case 'bi-weekly': return count === 1 ? 'pay period' : 'pay periods';
      default: return count === 1 ? 'month' : 'months';
    }
  }, [frequency]);

  return { 
    payday, 
    frequency, 
    weeklyPayday,
    biweeklyPayday1,
    biweeklyPayday2,
    isLoading,
    updatePayday, 
    updateFrequency,
    updateWeeklyPayday,
    updateBiweeklyPayday1,
    updateBiweeklyPayday2,
    getNextPayday,
    getNthPayday,
    countPayPeriods,
    getFrequencyLabel,
    getPeriodTerm,
    weekdayNames: WEEKDAY_NAMES,
  };
};
