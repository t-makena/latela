import { Transaction } from '@/lib/data';

export const calculateFinancialMetrics = (transactions: Transaction[]) => {
  console.log('All transactions:', transactions);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Filter transactions for current month
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.transaction_date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });

  console.log('Current month transactions:', currentMonthTransactions);

  // Calculate monthly income from salary deposits only - make the search more flexible
  const salaryTransactions = currentMonthTransactions.filter(t => {
    const description = t.description.toLowerCase();
    return t.amount > 0 && (
      description.includes('salary') || 
      description.includes('wage') || 
      description.includes('pay') ||
      description.includes('income')
    );
  });
  
  console.log('Salary transactions:', salaryTransactions);
  
  const monthlyIncome = salaryTransactions.reduce((sum, t) => sum + t.amount, 0);
  console.log('Monthly income:', monthlyIncome);

  // Calculate monthly expenses as total of all negative values
  const expenseTransactions = currentMonthTransactions.filter(t => t.amount < 0);
  const monthlyExpenses = Math.abs(expenseTransactions.reduce((sum, t) => sum + t.amount, 0));
  console.log('Monthly expenses:', monthlyExpenses);

  // Calculate savings as "transfer from cheque" plus "transfer to cheque"
  const transferFromCheque = currentMonthTransactions
    .filter(t => t.description.toLowerCase().includes('transfer from cheque'))
    .reduce((sum, t) => sum + t.amount, 0);
  
  const transferToCheque = currentMonthTransactions
    .filter(t => t.description.toLowerCase().includes('transfer to cheque'))
    .reduce((sum, t) => sum + t.amount, 0);
  
  const monthlySavings = transferFromCheque + transferToCheque;
  console.log('Monthly savings:', monthlySavings);

  // Net balance is the total of all transaction values
  const netBalance = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
  console.log('Net balance:', netBalance);

  // Calculate account balances
  const accountBalances = transactions.reduce((acc, transaction) => {
    if (!acc[transaction.account_id]) {
      acc[transaction.account_id] = 0;
    }
    acc[transaction.account_id] += transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  // Generate category breakdown from descriptions
  const categoryBreakdown = transactions
    .filter(t => t.amount < 0) // Only expenses
    .reduce((acc, transaction) => {
      const category = transaction.description;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Math.abs(transaction.amount);
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
      const transactionDate = new Date(t.transaction_date);
      return transactionDate.getMonth() === i && transactionDate.getFullYear() === currentYear;
    });
    
    const expenses = Math.abs(monthTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));
    
    const income = monthTransactions
      .filter(t => {
        const description = t.description.toLowerCase();
        return t.amount > 0 && (
          description.includes('salary') || 
          description.includes('wage') || 
          description.includes('pay') ||
          description.includes('income')
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    const transferFromChequeMonth = monthTransactions
      .filter(t => t.description.toLowerCase().includes('transfer from cheque'))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const transferToChequeMonth = monthTransactions
      .filter(t => t.description.toLowerCase().includes('transfer to cheque'))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const savings = transferFromChequeMonth + transferToChequeMonth;
    const netBalanceMonth = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

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
