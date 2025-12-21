import { useMemo, useCallback } from 'react';
import { useGoals } from './useGoals';
import { useUserSettings, SavingsAdjustmentStrategy } from './useUserSettings';
import { useTransactions } from './useTransactions';
import { calculateFinancialMetrics } from '@/lib/realData';

export interface AdjustmentResult {
  goalId: string;
  goalName: string;
  priorityPercentage: number;
  currentAllocation: number;
  reduction: number;
  newAllocation: number;
  originalTimeline: string;
  newTimeline: string;
  timelineExtensionMonths: number;
}

export interface SavingsStatus {
  expectedBalance: number;
  availableBalance: number;
  shortfall: number;
  hasShortfall: boolean;
  adjustments: AdjustmentResult[];
}

// Calculate weight for priority formula: (Target - CurrentSaved) / MonthsLeft²
const calculateWeight = (target: number, currentSaved: number, monthsLeft: number): number => {
  const remaining = target - currentSaved;
  if (remaining <= 0) return 0;
  return remaining / Math.pow(Math.max(1, monthsLeft), 2);
};

// Calculate new timeline based on new allocation
const calculateNewTimeline = (
  target: number,
  currentSaved: number,
  newMonthlyAllocation: number
): { timeline: string; months: number } => {
  if (newMonthlyAllocation <= 0) {
    return { timeline: 'Never', months: Infinity };
  }
  
  const remaining = target - currentSaved;
  if (remaining <= 0) {
    return { timeline: 'Complete', months: 0 };
  }
  
  const monthsNeeded = Math.ceil(remaining / newMonthlyAllocation);
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + monthsNeeded);
  
  const timeline = futureDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });
  
  return { timeline, months: monthsNeeded };
};

export const useSavingsAdjustment = () => {
  const { goals } = useGoals();
  const { savingsAdjustmentStrategy } = useUserSettings();
  const { transactions } = useTransactions();
  
  // Calculate available balance from transactions
  const { netBalance } = calculateFinancialMetrics(transactions);
  
  // Expected balance = sum of all monthly allocations (what user plans to save)
  const expectedBalance = useMemo(() => {
    return goals.reduce((sum, goal) => sum + goal.monthlyAllocation, 0);
  }, [goals]);
  
  // Current available balance
  const availableBalance = netBalance;
  
  // Calculate shortfall
  const shortfall = useMemo(() => {
    const diff = expectedBalance - availableBalance;
    return Math.max(0, diff);
  }, [expectedBalance, availableBalance]);
  
  const hasShortfall = shortfall > 0;
  
  // Calculate adjustments based on selected strategy
  const calculateAdjustments = useCallback((
    shortfallAmount: number,
    strategy: SavingsAdjustmentStrategy
  ): AdjustmentResult[] => {
    if (shortfallAmount <= 0) return [];
    
    const activeGoals = goals.filter(g => !g.isComplete && g.monthlyAllocation > 0);
    if (activeGoals.length === 0) return [];
    
    // Calculate weights for each goal (needed for inverse priority)
    const goalsWithWeights = activeGoals.map(goal => {
      const weight = calculateWeight(goal.target, goal.amountSaved, goal.monthsLeft);
      return { goal, weight };
    });
    
    const totalWeight = goalsWithWeights.reduce((sum, { weight }) => sum + weight, 0);
    
    // Calculate priority percentages
    const goalsWithPriority = goalsWithWeights.map(({ goal, weight }) => ({
      goal,
      priorityPercentage: totalWeight > 0 ? (weight / totalWeight) * 100 : 0
    }));
    
    const totalAllocation = activeGoals.reduce((sum, g) => sum + g.monthlyAllocation, 0);
    
    return goalsWithPriority.map(({ goal, priorityPercentage }) => {
      let reduction = 0;
      
      switch (strategy) {
        case 'inverse_priority': {
          // Inversely proportional: lower priority gets more reduction
          const inversePriorities = goalsWithPriority.map(g => 100 - g.priorityPercentage);
          const totalInverse = inversePriorities.reduce((sum, p) => sum + p, 0);
          const inverseShare = totalInverse > 0 
            ? (100 - priorityPercentage) / totalInverse 
            : 1 / activeGoals.length;
          reduction = shortfallAmount * inverseShare;
          break;
        }
        case 'proportional': {
          // Proportional: reduce based on allocation percentage
          const allocationShare = totalAllocation > 0 
            ? goal.monthlyAllocation / totalAllocation 
            : 1 / activeGoals.length;
          reduction = shortfallAmount * allocationShare;
          break;
        }
        case 'even_distribution': {
          // Even: reduce equally across all goals
          reduction = shortfallAmount / activeGoals.length;
          break;
        }
      }
      
      // Ensure reduction doesn't exceed current allocation
      reduction = Math.min(reduction, goal.monthlyAllocation);
      
      const newAllocation = goal.monthlyAllocation - reduction;
      const { timeline: newTimeline, months: newMonths } = calculateNewTimeline(
        goal.target,
        goal.amountSaved,
        newAllocation
      );
      
      // Calculate original months
      const originalMonths = goal.monthlyAllocation > 0
        ? Math.ceil((goal.target - goal.amountSaved) / goal.monthlyAllocation)
        : Infinity;
      
      return {
        goalId: goal.id,
        goalName: goal.name,
        priorityPercentage,
        currentAllocation: goal.monthlyAllocation,
        reduction: Math.round(reduction * 100) / 100,
        newAllocation: Math.round(newAllocation * 100) / 100,
        originalTimeline: goal.timeline,
        newTimeline,
        timelineExtensionMonths: newMonths - originalMonths,
      };
    });
  }, [goals]);
  
  // Get current adjustments based on settings
  const adjustments = useMemo(() => {
    return calculateAdjustments(shortfall, savingsAdjustmentStrategy);
  }, [shortfall, savingsAdjustmentStrategy, calculateAdjustments]);
  
  // Get savings status
  const savingsStatus: SavingsStatus = {
    expectedBalance,
    availableBalance,
    shortfall,
    hasShortfall,
    adjustments,
  };
  
  // Generate chart data for balance visualization
  const generateChartData = useCallback(() => {
    const now = new Date();
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Calculate cumulative savings at each point
      const monthsSoFar = 6 - i;
      const cumulativeSavings = goals.reduce((sum, goal) => sum + goal.amountSaved, 0);
      const expectedAtPoint = expectedBalance * monthsSoFar;
      
      data.push({
        month: monthName,
        available: Math.round(availableBalance + (i * expectedBalance * 0.1)),
        expected: Math.round(expectedAtPoint / 6),
        savings: Math.round(cumulativeSavings * (monthsSoFar / 6)),
      });
    }
    
    return data;
  }, [goals, expectedBalance, availableBalance]);
  
  return {
    savingsStatus,
    calculateAdjustments,
    generateChartData,
  };
};
