// Shared transaction categorization logic for consistent categorization across all charts

export interface Transaction {
  description: string;
  amount: number;
  transaction_date: string;
  type: string;
}

// Map transaction keywords to category codes
const categoryKeywordMapping: { [key: string]: string } = {
  // Food & Groceries (F&G)
  'woolworths': 'Food & Groceries',
  'pick n pay': 'Food & Groceries',
  'checkers': 'Food & Groceries',
  'groceries': 'Food & Groceries',
  'food': 'Food & Groceries',
  'supermarket': 'Food & Groceries',
  'spar': 'Food & Groceries',
  
  // Transportation & Fuel (T/F)
  'uber': 'Transportation & Fuel',
  'shell': 'Transportation & Fuel',
  'engen': 'Transportation & Fuel',
  'fuel': 'Transportation & Fuel',
  'petrol': 'Transportation & Fuel',
  'transport': 'Transportation & Fuel',
  'taxi': 'Transportation & Fuel',
  'capitec atm': 'Transportation & Fuel',
  
  // Dining & Restaurants (D&R)
  'mcdonalds': 'Dining & Restaurants',
  'kfc': 'Dining & Restaurants',
  'nandos': 'Dining & Restaurants',
  "nando's": 'Dining & Restaurants',
  'restaurant': 'Dining & Restaurants',
  'dining': 'Dining & Restaurants',
  'takeaway': 'Dining & Restaurants',
  'pizza': 'Dining & Restaurants',
  
  // Shopping & Retail (S&R)
  'takealot': 'Shopping & Retail',
  'mr price': 'Shopping & Retail',
  'edgars': 'Shopping & Retail',
  'game': 'Shopping & Retail',
  'game stores': 'Shopping & Retail',
  'shopping': 'Shopping & Retail',
  'retail': 'Shopping & Retail',
  'clothing': 'Shopping & Retail',
  'fashion': 'Shopping & Retail',
  
  // Entertainment & Recreation (E&R)
  'gym': 'Entertainment & Recreation',
  'entertainment': 'Entertainment & Recreation',
  'movie': 'Entertainment & Recreation',
  'cinema': 'Entertainment & Recreation',
  'sport': 'Entertainment & Recreation',
  
  // Personal & Lifestyle (P&L) - intentionally left empty for now
  
  // Housing & Utilities (H&U)
  'rent': 'Housing & Utilities',
  'utilities': 'Housing & Utilities',
  'electricity': 'Housing & Utilities',
  'water': 'Housing & Utilities',
  'eskom': 'Housing & Utilities',
  'municipal': 'Housing & Utilities',
  
  // Healthcare & Medical (H&M)
  'dischem': 'Healthcare & Medical',
  'clicks': 'Healthcare & Medical',
  'pharmacy': 'Healthcare & Medical',
  'medical': 'Healthcare & Medical',
  'doctor': 'Healthcare & Medical',
  'health': 'Healthcare & Medical',
  'hospital': 'Healthcare & Medical',
  
  // Bills & Subscriptions (B&S)
  'netflix': 'Bills & Subscriptions',
  'subscription': 'Bills & Subscriptions',
  'spotify': 'Bills & Subscriptions',
  'insurance': 'Bills & Subscriptions',
  'dstv': 'Bills & Subscriptions',
  
  // Savings & Investments (S&I)
  'savings': 'Savings & Investments',
  'investment': 'Savings & Investments',
  'transfer': 'Savings & Investments',
  'freelance payment': 'Savings & Investments',
  'salary credit': 'Savings & Investments',
  'refund': 'Savings & Investments',
};

/**
 * Categorizes a transaction based on its description
 * @param description - The transaction description to categorize
 * @returns The full category name
 */
export const categorizeTransaction = (description: string): string => {
  const desc = description?.toLowerCase() || '';
  
  for (const [keyword, category] of Object.entries(categoryKeywordMapping)) {
    if (desc.includes(keyword)) {
      return category;
    }
  }
  
  return 'Miscellaneous';
};
