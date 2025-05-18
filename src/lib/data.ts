
export interface AccountType {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: string;
  color: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
}

export interface BudgetGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  endDate: string | null;
  color: string;
}

// Mock data for development
export const accounts: AccountType[] = [
  {
    id: '1',
    name: 'Main Checking',
    type: 'checking',
    balance: 2450.65,
    currency: 'USD',
    color: '#1e65ff',
  },
  {
    id: '2',
    name: 'Savings',
    type: 'savings',
    balance: 15680.23,
    currency: 'USD',
    color: '#41b883',
  },
  {
    id: '3',
    name: 'Credit Card',
    type: 'credit',
    balance: -450.65,
    currency: 'USD',
    color: '#ff6b6b',
  },
  {
    id: '4',
    name: 'Investment Portfolio',
    type: 'investment',
    balance: 42500,
    currency: 'USD',
    color: '#8959a8',
  },
];

export const transactions: Transaction[] = [
  {
    id: '1',
    accountId: '1',
    amount: 2500,
    category: 'Income',
    date: '2025-05-15',
    description: 'Salary deposit',
    type: 'income',
  },
  {
    id: '2',
    accountId: '1',
    amount: 120.50,
    category: 'Groceries',
    date: '2025-05-16',
    description: 'Whole Foods',
    type: 'expense',
  },
  {
    id: '3',
    accountId: '1',
    amount: 49.99,
    category: 'Entertainment',
    date: '2025-05-17',
    description: 'Streaming subscription',
    type: 'expense',
  },
  {
    id: '4',
    accountId: '2',
    amount: 500,
    category: 'Transfer',
    date: '2025-05-15',
    description: 'Monthly savings',
    type: 'expense',
  },
  {
    id: '5',
    accountId: '3',
    amount: 75.25,
    category: 'Dining',
    date: '2025-05-14',
    description: 'Restaurant',
    type: 'expense',
  },
];

export const budgetGoals: BudgetGoal[] = [
  {
    id: '1',
    name: 'Vacation Fund',
    targetAmount: 3000,
    currentAmount: 1500,
    category: 'Savings',
    endDate: '2025-08-15',
    color: '#1e65ff',
  },
  {
    id: '2',
    name: 'New Laptop',
    targetAmount: 2000,
    currentAmount: 800,
    category: 'Electronics',
    endDate: '2025-07-01',
    color: '#41b883',
  },
  {
    id: '3',
    name: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 6500,
    category: 'Savings',
    endDate: null,
    color: '#8959a8',
  },
];

export const monthlySpending = [
  { month: 'Jan', amount: 2100 },
  { month: 'Feb', amount: 1950 },
  { month: 'Mar', amount: 2300 },
  { month: 'Apr', amount: 2400 },
  { month: 'May', amount: 2000 },
];

export const categoryBreakdown = [
  { name: 'Housing', value: 1200 },
  { name: 'Food', value: 450 },
  { name: 'Transportation', value: 300 },
  { name: 'Entertainment', value: 200 },
  { name: 'Utilities', value: 180 },
  { name: 'Other', value: 150 },
];

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const getNetWorth = (): number => {
  return accounts.reduce((total, account) => total + account.balance, 0);
};

export const getMonthlyIncome = (): number => {
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  return incomeTransactions.reduce((total, t) => total + t.amount, 0);
};

export const getMonthlyExpenses = (): number => {
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  return expenseTransactions.reduce((total, t) => total + t.amount, 0);
};

export const getAIInsights = (): string[] => {
  return [
    "Your food spending is 15% higher than last month. Consider meal prepping to reduce costs.",
    "Great job adding to your emergency fund! You're 65% towards your target goal.",
    "You've been consistent with monthly savings. Consider investing some of that for higher returns.",
  ];
};
