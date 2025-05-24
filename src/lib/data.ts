export interface AccountType {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
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
    currency: 'ZAR',
    color: '#1e65ff',
  },
  {
    id: '2',
    name: 'Savings',
    type: 'savings',
    balance: 15680.23,
    currency: 'ZAR',
    color: '#41b883',
  },
  {
    id: '3',
    name: 'Credit Card',
    type: 'credit',
    balance: -450.65,
    currency: 'ZAR',
    color: '#ff6b6b',
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
    category: 'Personal & Lifestyle',
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
    type: 'income',
  },
  {
    id: '5',
    accountId: '2',
    amount: 200,
    category: 'Transfer',
    date: '2025-05-10',
    description: 'Emergency withdrawal',
    type: 'expense',
  },
  {
    id: '6',
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
  { month: 'Jan', amount: 2100, savings: 500, netBalance: 1600 },
  { month: 'Feb', amount: 1950, savings: 500, netBalance: 1550 },
  { month: 'Mar', amount: 2300, savings: 500, netBalance: 1200 },
  { month: 'Apr', amount: 2400, savings: 500, netBalance: 1100 },
  { month: 'May', amount: 2000, savings: 500, netBalance: 1500 },
  { month: 'Jun', amount: 1800, savings: 500, netBalance: 1700 },
];

export const dailySpending = [
  { 
    day: 'Mon', 
    amount: 784, 
    date: '2025-05-19',
    categories: [
      { name: 'Food', value: 392, percentage: 50, color: '#41b883' },
      { name: 'Transportation', value: 196, percentage: 25, color: '#ffd166' },
      { name: 'Personal & Lifestyle', value: 196, percentage: 25, color: '#8959a8' }
    ]
  },
  { 
    day: 'Tue', 
    amount: 320, 
    date: '2025-05-20',
    categories: [
      { name: 'Dining', value: 160, percentage: 50, color: '#ff6b6b' },
      { name: 'Personal & Lifestyle', value: 160, percentage: 50, color: '#8959a8' }
    ]
  },
  { 
    day: 'Wed', 
    amount: 450, 
    date: '2025-05-21',
    categories: [
      { name: 'Housing & Utilities', value: 225, percentage: 50, color: '#1e65ff' },
      { name: 'Groceries', value: 225, percentage: 50, color: '#41b883' }
    ]
  },
  { 
    day: 'Thu', 
    amount: 280, 
    date: '2025-05-22',
    categories: [
      { name: 'Transportation', value: 168, percentage: 60, color: '#ffd166' },
      { name: 'Food', value: 112, percentage: 40, color: '#41b883' }
    ]
  },
  { 
    day: 'Fri', 
    amount: 380, 
    date: '2025-05-23',
    categories: [
      { name: 'Groceries', value: 190, percentage: 50, color: '#41b883' },
      { name: 'Personal & Lifestyle', value: 114, percentage: 30, color: '#8959a8' },
      { name: 'Miscellaneous', value: 76, percentage: 20, color: '#6c757d' }
    ]
  },
  { 
    day: 'Sat', 
    amount: 620, 
    date: '2025-05-24',
    categories: [
      { name: 'Housing & Utilities', value: 372, percentage: 60, color: '#1e65ff' },
      { name: 'Dining', value: 248, percentage: 40, color: '#ff6b6b' }
    ]
  },
  { 
    day: 'Sun', 
    amount: 150, 
    date: '2025-05-25',
    categories: [
      { name: 'Personal & Lifestyle', value: 90, percentage: 60, color: '#8959a8' },
      { name: 'Miscellaneous', value: 60, percentage: 40, color: '#6c757d' }
    ]
  },
];

export const futureDailySpending = [
  { day: 'Mon', amount: 0, date: '2025-05-26', categories: [] },
  { day: 'Tue', amount: 0, date: '2025-05-27', categories: [] },
  { day: 'Wed', amount: 0, date: '2025-05-28', categories: [] },
  { day: 'Thu', amount: 0, date: '2025-05-29', categories: [] },
  { day: 'Fri', amount: 0, date: '2025-05-30', categories: [] },
  { day: 'Sat', amount: 0, date: '2025-05-31', categories: [] },
  { day: 'Sun', amount: 0, date: '2025-06-01', categories: [] },
];

export const sixMonthSpending = [
  { month: 'Dec', amount: 1950, savings: 500, netBalance: 1550 },
  { month: 'Jan', amount: 2100, savings: 500, netBalance: 1600 },
  { month: 'Feb', amount: 1950, savings: 500, netBalance: 1550 },
  { month: 'Mar', amount: 2300, savings: 500, netBalance: 1200 },
  { month: 'Apr', amount: 2400, savings: 500, netBalance: 1100 },
  { month: 'May', amount: 2000, savings: 500, netBalance: 1500 },
];

export const savingsBalanceData = [
  { month: 'Jan', balance: 14500, transfersOut: 200 },
  { month: 'Feb', balance: 15000, transfersOut: 150 },
  { month: 'Mar', balance: 15500, transfersOut: 300 },
  { month: 'Apr', balance: 15180, transfersOut: 250 },
  { month: 'May', balance: 15680, transfersOut: 200 },
];

export const categoryBreakdown = [
  { name: 'Housing & Utilities', value: 1380 },
  { name: 'Food', value: 450 },
  { name: 'Transportation', value: 300 },
  { name: 'Personal & Lifestyle', value: 200 },
  { name: 'Miscellaneous', value: 150 },
];

export const formatCurrency = (amount: number, currency = 'ZAR'): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
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

export const getMonthlySavings = (): number => {
  const monthlyIncome = getMonthlyIncome();
  return monthlyIncome * 0.2; // 20% of income
};

export const getTargetAverageExpense = (): number => {
  const monthlyIncome = getMonthlyIncome();
  const savingsGoal = getMonthlySavings();
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = lastDayOfMonth - today.getDate();
  
  return (monthlyIncome - savingsGoal) / daysRemaining;
};

export const getAIInsights = (): string[] => {
  return [
    "Your food spending is 15% higher than last month. Consider meal prepping to reduce costs.",
    "Great job adding to your emergency fund! You're 65% towards your target goal.",
    "You've been consistent with monthly savings. Consider investing some of that for higher returns.",
  ];
};
