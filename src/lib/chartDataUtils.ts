import { DateRange } from "./dateFilterUtils";

interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  description: string;
  transaction_date: string;
  type: string;
  status?: string;
  category_id?: string;
  user_id?: string;
  created_at: string;
  updated_at?: string;
}

interface ChartDataPoint {
  [key: string]: any;
  total: number;
  dateRange: string;
  topCategory?: string;
}

// Map transaction descriptions to categories
const categoryMapping: { [key: string]: string } = {
  'rent': 'Housing & Utilities',
  'utilities': 'Housing & Utilities',
  'electricity': 'Housing & Utilities',
  'water': 'Housing & Utilities',
  'savings': 'Savings & Investments',
  'investment': 'Savings & Investments',
  'groceries': 'Food & Groceries',
  'food': 'Food & Groceries',
  'supermarket': 'Food & Groceries',
  'fuel': 'Transportation & Fuel',
  'petrol': 'Transportation & Fuel',
  'transport': 'Transportation & Fuel',
  'uber': 'Transportation & Fuel',
  'restaurant': 'Dining & Restaurants',
  'dining': 'Dining & Restaurants',
  'takeaway': 'Dining & Restaurants',
  'shopping': 'Shopping & Retail',
  'retail': 'Shopping & Retail',
  'clothing': 'Shopping & Retail',
  'entertainment': 'Entertainment & Recreation',
  'movie': 'Entertainment & Recreation',
  'gym': 'Entertainment & Recreation',
  'health': 'Healthcare & Medical',
  'medical': 'Healthcare & Medical',
  'doctor': 'Healthcare & Medical',
  'pharmacy': 'Healthcare & Medical',
  'subscription': 'Bills & Subscriptions',
  'netflix': 'Bills & Subscriptions',
  'spotify': 'Bills & Subscriptions',
  'insurance': 'Bills & Subscriptions',
};

export const categorizeTransaction = (transaction: Transaction): string => {
  const description = transaction.description?.toLowerCase() || '';
  
  for (const [keyword, category] of Object.entries(categoryMapping)) {
    if (description.includes(keyword)) {
      return category;
    }
  }
  
  return 'Miscellaneous';
};

export const generateChartDataFromTransactions = (
  transactions: Transaction[],
  labels: string[],
  dateRange: DateRange,
  periodType: 'day' | 'week' | 'month'
): ChartDataPoint[] => {
  // Filter transactions to date range and only expenses
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.transaction_date);
    return t.type === 'expense' && 
           transactionDate >= dateRange.from && 
           transactionDate <= dateRange.to;
  });

  // Initialize data structure
  const chartData: ChartDataPoint[] = labels.map((label, index) => {
    const dataPoint: ChartDataPoint = {
      [periodType]: label,
      total: 0,
      dateRange: label,
      "Housing & Utilities": 0,
      "Savings & Investments": 0,
      "Personal & Lifestyle": 0,
      "Food & Groceries": 0,
      "Transportation & Fuel": 0,
      "Dining & Restaurants": 0,
      "Shopping & Retail": 0,
      "Entertainment & Recreation": 0,
      "Healthcare & Medical": 0,
      "Bills & Subscriptions": 0,
      "Miscellaneous": 0
    };
    return dataPoint;
  });

  // Group transactions by period
  filteredTransactions.forEach(transaction => {
    const transactionDate = new Date(transaction.transaction_date);
    let labelIndex = -1;

    if (periodType === 'day') {
      // Find which day label this transaction belongs to
      const daysDiff = Math.floor(
        (transactionDate.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
      );
      labelIndex = daysDiff;
    } else if (periodType === 'week') {
      // Find which week label this transaction belongs to
      const weeksDiff = Math.floor(
        (transactionDate.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24 * 7)
      );
      labelIndex = weeksDiff;
    } else if (periodType === 'month') {
      // Find which month label this transaction belongs to
      const monthName = transactionDate.toLocaleDateString('en-US', { month: 'short' });
      labelIndex = labels.indexOf(monthName);
    }

    if (labelIndex >= 0 && labelIndex < chartData.length) {
      const category = categorizeTransaction(transaction);
      const amount = Math.abs(transaction.amount);
      
      chartData[labelIndex][category] = (chartData[labelIndex][category] || 0) + amount;
      chartData[labelIndex].total += amount;
    }
  });

  // Determine top category for each data point (for rounded corners)
  chartData.forEach(dataPoint => {
    const categories = [
      "Housing & Utilities",
      "Savings & Investments",
      "Personal & Lifestyle",
      "Food & Groceries",
      "Transportation & Fuel",
      "Dining & Restaurants",
      "Shopping & Retail",
      "Entertainment & Recreation",
      "Healthcare & Medical",
      "Bills & Subscriptions",
      "Miscellaneous"
    ];
    
    let topCategory = '';
    categories.forEach(cat => {
      if (dataPoint[cat] > 0) topCategory = cat;
    });
    dataPoint.topCategory = topCategory;
  });

  return chartData;
};
