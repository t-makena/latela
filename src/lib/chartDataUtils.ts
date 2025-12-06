import { DateRange } from "./dateFilterUtils";
import { categorizeTransaction as categorizeTxn } from "./transactionCategories";

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
  // Category details from view
  parent_category_name?: string | null;
  subcategory_name?: string | null;
  display_subcategory_name?: string | null;
}

interface ChartDataPoint {
  [key: string]: any;
  total: number;
  dateRange: string;
  topCategory?: string;
}

export const categorizeTransaction = (transaction: Transaction): string => {
  // Use subcategory first (e.g., "Healthcare & Medical"), then display_subcategory, then parent_category
  if (transaction.display_subcategory_name) {
    return transaction.display_subcategory_name;
  }
  if (transaction.subcategory_name) {
    return transaction.subcategory_name;
  }
  if (transaction.parent_category_name) {
    return transaction.parent_category_name;
  }
  return categorizeTxn(transaction.description);
};

// Map transaction descriptions to categories (deprecated - use transactionCategories.ts)
const categoryMapping: { [key: string]: string } = {};

export const generateChartDataFromTransactions = (
  transactions: Transaction[],
  labels: string[],
  dateRange: DateRange,
  periodType: 'day' | 'week' | 'month'
): ChartDataPoint[] => {
  // Filter transactions to date range and only expenses (amount < 0)
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.transaction_date);
    return t.amount < 0 && 
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
      // Find which month label this transaction belongs to (format: "Apr '25")
      const month = transactionDate.toLocaleDateString('en-US', { month: 'short' });
      const year = transactionDate.getFullYear().toString().slice(-2);
      const monthLabel = `${month} '${year}`;
      labelIndex = labels.indexOf(monthLabel);
    }

    if (labelIndex >= 0 && labelIndex < chartData.length) {
      const category = categorizeTransaction(transaction);
      const amount = Math.abs(transaction.amount); // Already in Rands
      
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
