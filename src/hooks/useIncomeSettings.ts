import { useState } from 'react';

export type IncomeFrequency = 'monthly' | 'bi-weekly' | 'weekly';

interface IncomeSettings {
  payday: number;
  frequency: IncomeFrequency;
  weeklyPayday: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  biweeklyPayday1: number; // First pay date (1-31)
  biweeklyPayday2: number; // Second pay date (1-31)
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const useIncomeSettings = () => {
  const [payday, setPayday] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userPayday');
      return saved ? parseInt(saved, 10) : 25;
    }
    return 25;
  });

  const [frequency, setFrequency] = useState<IncomeFrequency>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('incomeFrequency');
      return (saved as IncomeFrequency) || 'monthly';
    }
    return 'monthly';
  });

  const [weeklyPayday, setWeeklyPayday] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weeklyPayday');
      return saved ? parseInt(saved, 10) : 5; // Default to Friday
    }
    return 5;
  });

  const [biweeklyPayday1, setBiweeklyPayday1] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('biweeklyPayday1');
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });

  const [biweeklyPayday2, setBiweeklyPayday2] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('biweeklyPayday2');
      return saved ? parseInt(saved, 10) : 15;
    }
    return 15;
  });

  const updatePayday = (day: number) => {
    const validDay = Math.max(1, Math.min(31, day));
    setPayday(validDay);
    localStorage.setItem('userPayday', validDay.toString());
  };

  const updateFrequency = (freq: IncomeFrequency) => {
    setFrequency(freq);
    localStorage.setItem('incomeFrequency', freq);
  };

  const updateWeeklyPayday = (day: number) => {
    const validDay = Math.max(0, Math.min(6, day));
    setWeeklyPayday(validDay);
    localStorage.setItem('weeklyPayday', validDay.toString());
  };

  const updateBiweeklyPayday1 = (day: number) => {
    const validDay = Math.max(1, Math.min(31, day));
    setBiweeklyPayday1(validDay);
    localStorage.setItem('biweeklyPayday1', validDay.toString());
  };

  const updateBiweeklyPayday2 = (day: number) => {
    const validDay = Math.max(1, Math.min(31, day));
    setBiweeklyPayday2(validDay);
    localStorage.setItem('biweeklyPayday2', validDay.toString());
  };

  // Helper to get the next payday from a given date
  const getNextPayday = (fromDate: Date): Date => {
    const today = new Date(fromDate);
    today.setHours(0, 0, 0, 0);

    if (frequency === 'weekly') {
      // Find next occurrence of the weekly payday
      const currentDay = today.getDay();
      let daysUntilPayday = (weeklyPayday - currentDay + 7) % 7;
      if (daysUntilPayday === 0) daysUntilPayday = 7; // If today is payday, get next week
      const nextPayday = new Date(today);
      nextPayday.setDate(today.getDate() + daysUntilPayday);
      return nextPayday;
    } else if (frequency === 'bi-weekly') {
      // Find next occurrence of either bi-weekly payday
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentDate = today.getDate();
      
      // Get both paydays for this month
      const payday1ThisMonth = new Date(currentYear, currentMonth, biweeklyPayday1);
      const payday2ThisMonth = new Date(currentYear, currentMonth, biweeklyPayday2);
      
      // Sort them
      const [firstPayday, secondPayday] = biweeklyPayday1 < biweeklyPayday2 
        ? [payday1ThisMonth, payday2ThisMonth] 
        : [payday2ThisMonth, payday1ThisMonth];
      
      if (today < firstPayday) {
        return firstPayday;
      } else if (today < secondPayday) {
        return secondPayday;
      } else {
        // Next month's first payday
        const nextMonth = currentMonth + 1;
        const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
        const adjustedMonth = nextMonth % 12;
        const smallerPayday = Math.min(biweeklyPayday1, biweeklyPayday2);
        return new Date(nextYear, adjustedMonth, smallerPayday);
      }
    } else {
      // Monthly
      const nextPayday = new Date(today);
      nextPayday.setDate(payday);
      
      if (nextPayday <= today) {
        nextPayday.setMonth(nextPayday.getMonth() + 1);
      }
      
      return nextPayday;
    }
  };

  // Get the Nth payday from today
  const getNthPayday = (periodsFromNow: number): Date => {
    if (periodsFromNow <= 0) return new Date();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (frequency === 'weekly') {
      // Get next weekly payday
      let payDate = getNextPayday(today);
      // Add (n-1) weeks
      payDate.setDate(payDate.getDate() + (periodsFromNow - 1) * 7);
      return payDate;
    } else if (frequency === 'bi-weekly') {
      // Get all bi-weekly paydays until we have enough
      const paydays: Date[] = [];
      let currentMonth = today.getMonth();
      let currentYear = today.getFullYear();
      
      while (paydays.length < periodsFromNow) {
        const p1 = new Date(currentYear, currentMonth, biweeklyPayday1);
        const p2 = new Date(currentYear, currentMonth, biweeklyPayday2);
        
        if (p1 > today) paydays.push(p1);
        if (p2 > today) paydays.push(p2);
        
        // Sort and dedupe
        paydays.sort((a, b) => a.getTime() - b.getTime());
        
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }
      
      return paydays[periodsFromNow - 1];
    } else {
      // Monthly
      let payDate = getNextPayday(today);
      payDate.setMonth(payDate.getMonth() + (periodsFromNow - 1));
      return payDate;
    }
  };

  // Count pay periods between now and a target date
  const countPayPeriods = (targetDate: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    const firstPayday = getNextPayday(today);
    
    if (target < firstPayday) {
      return 0;
    }

    if (frequency === 'weekly') {
      // Count weeks between first payday and target
      let count = 0;
      let currentPayday = new Date(firstPayday);
      
      while (currentPayday <= target) {
        count++;
        currentPayday.setDate(currentPayday.getDate() + 7);
      }
      
      return count;
    } else if (frequency === 'bi-weekly') {
      // Count all bi-weekly paydays between now and target
      let count = 0;
      let currentMonth = firstPayday.getMonth();
      let currentYear = firstPayday.getFullYear();
      
      while (true) {
        const p1 = new Date(currentYear, currentMonth, biweeklyPayday1);
        const p2 = new Date(currentYear, currentMonth, biweeklyPayday2);
        
        if (p1 > today && p1 <= target) count++;
        if (p2 > today && p2 <= target) count++;
        
        // Check if we've passed the target date
        const maxPayday = Math.max(biweeklyPayday1, biweeklyPayday2);
        if (new Date(currentYear, currentMonth, maxPayday) > target) break;
        
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }
      
      return count;
    } else {
      // Monthly
      let count = 0;
      let currentPayday = new Date(firstPayday);
      
      while (currentPayday <= target) {
        count++;
        currentPayday.setMonth(currentPayday.getMonth() + 1);
      }
      
      return count;
    }
  };

  // Get frequency label for UI
  const getFrequencyLabel = (): string => {
    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'bi-weekly': return 'Bi-weekly';
      default: return 'Monthly';
    }
  };

  // Get period term (week/pay period/month)
  const getPeriodTerm = (count: number): string => {
    switch (frequency) {
      case 'weekly': return count === 1 ? 'week' : 'weeks';
      case 'bi-weekly': return count === 1 ? 'pay period' : 'pay periods';
      default: return count === 1 ? 'month' : 'months';
    }
  };

  return { 
    payday, 
    frequency, 
    weeklyPayday,
    biweeklyPayday1,
    biweeklyPayday2,
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
