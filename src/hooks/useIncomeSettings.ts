import { useState, useEffect } from 'react';

export type IncomeFrequency = 'monthly' | 'bi-weekly' | 'weekly';

interface IncomeSettings {
  payday: number;
  frequency: IncomeFrequency;
}

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

  const updatePayday = (day: number) => {
    const validDay = Math.max(1, Math.min(31, day));
    setPayday(validDay);
    localStorage.setItem('userPayday', validDay.toString());
  };

  const updateFrequency = (freq: IncomeFrequency) => {
    setFrequency(freq);
    localStorage.setItem('incomeFrequency', freq);
  };

  // Helper to get the next payday from a given date
  const getNextPayday = (fromDate: Date): Date => {
    const nextPayday = new Date(fromDate);
    nextPayday.setDate(payday);
    
    // If payday has already passed this month, move to next month
    if (nextPayday <= fromDate) {
      nextPayday.setMonth(nextPayday.getMonth() + 1);
    }
    
    return nextPayday;
  };

  // Get the Nth payday from today
  const getNthPayday = (periodsFromNow: number): Date => {
    const today = new Date();
    let payDate = getNextPayday(today);
    
    // Add additional periods (we already have the 1st payday)
    if (frequency === 'monthly') {
      payDate.setMonth(payDate.getMonth() + (periodsFromNow - 1));
    } else if (frequency === 'bi-weekly') {
      payDate.setDate(payDate.getDate() + (periodsFromNow - 1) * 14);
    } else if (frequency === 'weekly') {
      payDate.setDate(payDate.getDate() + (periodsFromNow - 1) * 7);
    }
    
    return payDate;
  };

  // Count pay periods between now and a target date
  const countPayPeriods = (targetDate: Date): number => {
    const today = new Date();
    const firstPayday = getNextPayday(today);
    
    if (targetDate < firstPayday) {
      return 0; // Target date is before next payday
    }
    
    let count = 0;
    let currentPayday = new Date(firstPayday);
    
    while (currentPayday <= targetDate) {
      count++;
      if (frequency === 'monthly') {
        currentPayday.setMonth(currentPayday.getMonth() + 1);
      } else if (frequency === 'bi-weekly') {
        currentPayday.setDate(currentPayday.getDate() + 14);
      } else if (frequency === 'weekly') {
        currentPayday.setDate(currentPayday.getDate() + 7);
      }
    }
    
    return count;
  };

  return { 
    payday, 
    frequency, 
    updatePayday, 
    updateFrequency,
    getNextPayday,
    getNthPayday,
    countPayPeriods
  };
};
