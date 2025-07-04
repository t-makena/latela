
import { useTransactions } from '@/hooks/useTransactions';

interface Transaction {
  acc_no: number;
  created_at: string;
  source: string;
  value: number;
}

export const calculateFinancialMetrics = (transactions: Transaction[]) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Filter transactions for current month
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.created_at);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });

  // Calculate monthly income from salary deposits only
  const monthlyIncome = currentMonthTransactions
    .filter(t => t.value > 0 && t.source.toLowerCase().includes('salary'))
    .reduce((sum, t) => sum + t.value, 0);

  // Calculate monthly expenses as total of all negative values
  const monthlyExpenses = Math.abs(currentMonthTransactions
    .filter(t => t.value < 0)
    .reduce((sum, t) => sum + t.value, 0));

  // Calculate savings as "transfer from cheque" minus "transfer from savings"
  const transferFromCheque = currentMonthTransactions
    .filter(t => t.source.toLowerCase().includes('transfer from cheque'))
    .reduce((sum, t) => sum + t.value, 0);
  
  const transferFromSavings = currentMonthTransactions
    .filter(t => t.source.toLowerCase().includes('transfer from savings'))
    .reduce((sum, t) => sum + t.value, 0);
  
  const monthlySavings = transferFromCheque - transferFromSavings;

  // Net balance is the total of all transaction values
  const netBalance = currentMonthTransactions
    .reduce((sum, t) => sum + t.value, 0);

  // Calculate account balances
  const accountBalances = transactions.reduce((acc, transaction) => {
    if (!acc[transaction.acc_no]) {
      acc[transaction.acc_no] = 0;
    }
    acc[transaction.acc_no] += transaction.value;
    return acc;
  }, {} as Record<number, number>);

  // Generate category breakdown from sources
  const categoryBreakdown = transactions
    .filter(t => t.value < 0) // Only expenses
    .reduce((acc, transaction) => {
      const category = transaction.source;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Math.abs(transaction.value);
      return acc;
    }, {} as Record<string, number>);

  const categoryBreakdownArray = Object.entries(categoryBreakdown)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Top 6 categories

  // Generate monthly spending data
  const monthlySpending = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(currentYear, i, 1).toLocaleDateString('en-US', { month: 'short' });
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      return transactionDate.getMonth() === i && transactionDate.getFullYear() === currentYear;
    });
    
    const expenses = Math.abs(monthTransactions
      .filter(t => t.value < 0)
      .reduce((sum, t) => sum + t.value, 0));
    
    const income = monthTransactions
      .filter(t => t.value > 0 && t.source.toLowerCase().includes('salary'))
      .reduce((sum, t) => sum + t.value, 0);
    
    const transferFromChequeMonth = monthTransactions
      .filter(t => t.source.toLowerCase().includes('transfer from cheque'))
      .reduce((sum, t) => sum + t.value, 0);
    
    const transferFromSavingsMonth = monthTransactions
      .filter(t => t.source.toLowerCase().includes('transfer from savings'))
      .reduce((sum, t) => sum + t.value, 0);
    
    const savings = transferFromChequeMonth - transferFromSavingsMonth;
    const netBalanceMonth = monthTransactions.reduce((sum, t) => sum + t.value, 0);

    return {
      month,
      amount: expenses,
      savings,
      netBalance: netBalanceMonth
    };
  });

  return {
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    netBalance,
    accountBalances,
    categoryBreakdownArray,
    monthlySpending,
    transactions: currentMonthTransactions
  };
};

export const formatCurrency = (amount: number, currency = 'ZAR') => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
