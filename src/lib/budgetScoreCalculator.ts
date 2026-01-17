import { supabase } from '@/integrations/supabase/client';

export interface BudgetScoreResult {
  totalScore: number;
  pillars: {
    budgetCompliance: number;
    spendingConsistency: number;
    savingsHealth: number;
    cashSurvivalRisk: number;
  };
  metrics: {
    remainingBalance: number;
    daysUntilPayday: number;
    avgDailySpend: number;
    expectedSpendToPayday: number;
    riskRatio: number;
    safeToSpendPerDay: number;
  };
  riskLevel: 'safe' | 'mild' | 'moderate' | 'high' | 'critical';
}

// Pillar weights
const WEIGHTS = {
  budgetCompliance: 0.40,
  spendingConsistency: 0.25,
  savingsHealth: 0.25,
  cashSurvivalRisk: 0.10
};

export async function calculateBudgetScore(
  userId: string,
  paydayDate: number = 25
): Promise<BudgetScoreResult> {
  const today = new Date();
  const currentDay = today.getDate();
  
  // Calculate days until payday
  let daysUntilPayday: number;
  if (currentDay < paydayDate) {
    daysUntilPayday = paydayDate - currentDay;
  } else if (currentDay === paydayDate) {
    daysUntilPayday = 0;
  } else {
    // Payday is next month
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    daysUntilPayday = (lastDayOfMonth - currentDay) + paydayDate;
  }
  
  // Get all user's accounts and sum balances
  const { data: accountsData } = await supabase
    .from('accounts')
    .select('id, current_balance, available_balance')
    .eq('user_id', userId)
    .eq('is_active', true);
  
  // Sum all account balances (stored in cents)
  const remainingBalanceCents = accountsData?.reduce((sum, acc) => {
    return sum + (acc.available_balance || acc.current_balance || 0);
  }, 0) || 0;
  
  const remainingBalance = remainingBalanceCents / 100;
  
  // Calculate average spending for same period over last 3 months
  const avgPeriodSpend = await calculateAvgPeriodSpend(userId, currentDay, paydayDate);
  
  const avgDailySpend = daysUntilPayday > 0 ? avgPeriodSpend / daysUntilPayday : avgPeriodSpend;
  const expectedSpendToPayday = avgDailySpend * daysUntilPayday;
  
  // Calculate Cash Survival Risk
  const cashSurvivalRisk = calculateCashSurvivalRisk(remainingBalance, expectedSpendToPayday);
  const riskRatio = remainingBalance > 0 ? expectedSpendToPayday / remainingBalance : 999;
  
  // Calculate other pillars
  const budgetCompliance = await calculateBudgetCompliance(userId);
  const spendingConsistency = await calculateSpendingConsistency(userId);
  const savingsHealth = await calculateSavingsHealth(userId, remainingBalance);
  
  // Calculate weighted total score (0-100)
  const totalScore = Math.round(
    (budgetCompliance * WEIGHTS.budgetCompliance +
     spendingConsistency * WEIGHTS.spendingConsistency +
     savingsHealth * WEIGHTS.savingsHealth +
     cashSurvivalRisk * WEIGHTS.cashSurvivalRisk) * 100
  );
  
  // Determine risk level
  const riskLevel = getRiskLevel(riskRatio);
  
  // Calculate safe to spend per day
  const safeToSpendPerDay = daysUntilPayday > 0 ? remainingBalance / daysUntilPayday : remainingBalance;
  
  return {
    totalScore: Math.max(0, Math.min(100, totalScore)),
    pillars: {
      budgetCompliance,
      spendingConsistency,
      savingsHealth,
      cashSurvivalRisk
    },
    metrics: {
      remainingBalance,
      daysUntilPayday,
      avgDailySpend,
      expectedSpendToPayday,
      riskRatio: Math.min(riskRatio, 999),
      safeToSpendPerDay
    },
    riskLevel
  };
}

async function calculateAvgPeriodSpend(
  userId: string,
  currentDay: number,
  paydayDate: number
): Promise<number> {
  const today = new Date();
  const periodSpends: number[] = [];
  
  // Look at last 3 months
  for (let i = 1; i <= 3; i++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    // Start date: same day as today in that month
    const startDate = new Date(year, month, Math.min(currentDay, new Date(year, month + 1, 0).getDate()));
    
    // End date: payday of that month (or next month if payday < currentDay)
    let endDate: Date;
    if (paydayDate > currentDay) {
      endDate = new Date(year, month, paydayDate);
    } else {
      endDate = new Date(year, month + 1, paydayDate);
    }
    
    // Query spending for this period (only expenses, negative amounts)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .lt('amount', 0)
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());
    
    if (transactions && transactions.length > 0) {
      // Amount is in cents, convert to Rands
      const totalSpend = transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount) / 100), 0);
      periodSpends.push(totalSpend);
    }
  }
  
  // Return average (or 0 if no data)
  if (periodSpends.length === 0) return 0;
  return periodSpends.reduce((a, b) => a + b, 0) / periodSpends.length;
}

function calculateCashSurvivalRisk(remainingBalance: number, expectedSpend: number): number {
  if (expectedSpend <= 0) return 1; // No expected spend = safe
  if (remainingBalance <= 0) return 0; // No money = critical
  
  const riskRatio = expectedSpend / remainingBalance;
  
  if (riskRatio <= 1) {
    return 1; // Safe - can afford expected spending
  } else {
    return Math.max(0, Math.min(1, 1 / riskRatio));
  }
}

async function calculateBudgetCompliance(userId: string): Promise<number> {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  // Get user's budget items
  const { data: budgetItems } = await supabase
    .from('budget_items')
    .select('id, name, amount, frequency')
    .eq('user_id', userId);
  
  if (!budgetItems || budgetItems.length === 0) return 0.5; // No budgets set = neutral score
  
  // Get spending for this month
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, description, display_merchant_name')
    .eq('user_id', userId)
    .lt('amount', 0)
    .gte('transaction_date', startOfMonth.toISOString())
    .lte('transaction_date', endOfMonth.toISOString());
  
  if (!transactions) return 0.5;
  
  // Calculate total budgeted (convert to monthly amounts)
  let totalBudgeted = 0;
  let totalWithinBudget = 0;
  
  budgetItems.forEach(item => {
    let monthlyAmount = Number(item.amount);
    switch (item.frequency) {
      case 'Weekly':
        monthlyAmount *= 4;
        break;
      case 'Bi-weekly':
        monthlyAmount *= 2;
        break;
      case 'Daily':
        monthlyAmount *= 30;
        break;
    }
    
    totalBudgeted += monthlyAmount;
    
    // Pro-rate budget based on day of month
    const dayOfMonth = today.getDate();
    const daysInMonth = endOfMonth.getDate();
    const proratedBudget = (monthlyAmount / daysInMonth) * dayOfMonth;
    
    // Calculate total spending (simplified - we compare total spend vs total budget)
    const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount) / 100), 0);
    const proratedTotalBudget = (totalBudgeted / daysInMonth) * dayOfMonth;
    
    if (totalSpent <= proratedTotalBudget) {
      totalWithinBudget = totalBudgeted;
    } else {
      const overspendRatio = totalSpent / proratedTotalBudget;
      if (overspendRatio < 1.5) {
        totalWithinBudget = totalBudgeted * (1 - (overspendRatio - 1));
      }
    }
  });
  
  return totalBudgeted > 0 ? Math.max(0, Math.min(1, totalWithinBudget / totalBudgeted)) : 0.5;
}

async function calculateSpendingConsistency(userId: string): Promise<number> {
  const today = new Date();
  const dayOfMonth = today.getDate();
  
  // Get this month's spending up to today
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const { data: thisMonthTx } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .lt('amount', 0)
    .gte('transaction_date', startOfMonth.toISOString())
    .lte('transaction_date', today.toISOString());
  
  const thisMonthSpend = thisMonthTx?.reduce((sum, t) => sum + Math.abs(Number(t.amount) / 100), 0) || 0;
  
  // Get average spending for same period in last 3 months
  const historicalSpends: number[] = [];
  
  for (let i = 1; i <= 3; i++) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - i, dayOfMonth);
    
    const { data: monthTx } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .lt('amount', 0)
      .gte('transaction_date', monthStart.toISOString())
      .lte('transaction_date', monthEnd.toISOString());
    
    if (monthTx && monthTx.length > 0) {
      historicalSpends.push(monthTx.reduce((sum, t) => sum + Math.abs(Number(t.amount) / 100), 0));
    }
  }
  
  if (historicalSpends.length === 0) return 0.5;
  
  const avgHistorical = historicalSpends.reduce((a, b) => a + b, 0) / historicalSpends.length;
  
  if (avgHistorical === 0) return 0.5;
  
  const deviationRatio = thisMonthSpend / avgHistorical;
  
  // Score based on how close to historical average
  if (deviationRatio >= 0.8 && deviationRatio <= 1.2) {
    return 1; // Within 20% = excellent
  } else if (deviationRatio < 0.8) {
    return 0.8 + (deviationRatio / 4); // Spending less = good
  } else {
    return Math.max(0, 1 - (deviationRatio - 1.2) * 0.5); // Spending more = risk
  }
}

async function calculateSavingsHealth(
  userId: string,
  currentBalance: number
): Promise<number> {
  // Get user's savings goals
  const { data: goals } = await supabase
    .from('goals')
    .select('target, current_saved')
    .eq('user_id', userId);
  
  // Get average monthly income (last 3 months)
  const today = new Date();
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  
  const { data: incomeTx } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .gt('amount', 0)
    .gte('transaction_date', threeMonthsAgo.toISOString());
  
  const totalIncome = incomeTx?.reduce((sum, t) => sum + Number(t.amount) / 100, 0) || 0;
  const avgMonthlyIncome = totalIncome / 3;
  
  // Calculate savings rate
  const avgMonthlyExpenses = await getAvgMonthlyExpenses(userId);
  const impliedMonthlySavings = avgMonthlyIncome - avgMonthlyExpenses;
  const savingsRate = avgMonthlyIncome > 0 ? Math.max(0, impliedMonthlySavings / avgMonthlyIncome) : 0;
  
  // Calculate goal progress
  let goalProgress = 0.5; // Default if no goals
  if (goals && goals.length > 0) {
    const totalTarget = goals.reduce((sum, g) => sum + Number(g.target), 0);
    const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_saved || 0), 0);
    goalProgress = totalTarget > 0 ? Math.min(1, totalSaved / totalTarget) : 0;
  }
  
  // Emergency fund check (3 months expenses recommended)
  const emergencyFundRatio = avgMonthlyExpenses > 0 ? currentBalance / (avgMonthlyExpenses * 3) : 0;
  const emergencyScore = Math.min(1, emergencyFundRatio);
  
  // Weighted combination
  return Math.min(1, (savingsRate * 0.3 + goalProgress * 0.4 + emergencyScore * 0.3));
}

async function getAvgMonthlyExpenses(userId: string): Promise<number> {
  const today = new Date();
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  
  const { data: expenses } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .lt('amount', 0)
    .gte('transaction_date', threeMonthsAgo.toISOString());
  
  const totalExpenses = expenses?.reduce((sum, t) => sum + Math.abs(Number(t.amount) / 100), 0) || 0;
  return totalExpenses / 3;
}

function getRiskLevel(riskRatio: number): 'safe' | 'mild' | 'moderate' | 'high' | 'critical' {
  if (riskRatio <= 0.8) return 'safe';
  if (riskRatio <= 1) return 'mild';
  if (riskRatio <= 1.5) return 'moderate';
  if (riskRatio <= 2) return 'high';
  return 'critical';
}
