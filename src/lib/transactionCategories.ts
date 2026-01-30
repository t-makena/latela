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
  'pnp': 'Food & Groceries',
  'checkers': 'Food & Groceries',
  'shoprite': 'Food & Groceries',
  'groceries': 'Food & Groceries',
  'food': 'Food & Groceries',
  'supermarket': 'Food & Groceries',
  'spar': 'Food & Groceries',
  'superspar': 'Food & Groceries',
  'usave': 'Food & Groceries',
  'boxer': 'Food & Groceries',
  'food lover': 'Food & Groceries',
  
  // Transportation & Fuel (T/F)
  'uber': 'Transportation & Fuel',
  'shell': 'Transportation & Fuel',
  'engen': 'Transportation & Fuel',
  'bp ': 'Transportation & Fuel',
  'c*bp': 'Transportation & Fuel',
  'sasol': 'Transportation & Fuel',
  'caltex': 'Transportation & Fuel',
  'total ': 'Transportation & Fuel',
  'astron': 'Transportation & Fuel',
  'fuel': 'Transportation & Fuel',
  'petrol': 'Transportation & Fuel',
  'transport': 'Transportation & Fuel',
  'taxi': 'Transportation & Fuel',
  'bolt': 'Transportation & Fuel',
  
  // Dining & Restaurants (D&R)
  'mcdonalds': 'Dining & Restaurants',
  'mcd': 'Dining & Restaurants',
  'kfc': 'Dining & Restaurants',
  'nandos': 'Dining & Restaurants',
  "nando's": 'Dining & Restaurants',
  'restaurant': 'Dining & Restaurants',
  'dining': 'Dining & Restaurants',
  'takeaway': 'Dining & Restaurants',
  'pizza': 'Dining & Restaurants',
  'steers': 'Dining & Restaurants',
  'burger': 'Dining & Restaurants',
  'chicken licken': 'Dining & Restaurants',
  'debonairs': 'Dining & Restaurants',
  'fishaways': 'Dining & Restaurants',
  'ocean basket': 'Dining & Restaurants',
  'spur': 'Dining & Restaurants',
  'wimpy': 'Dining & Restaurants',
  
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
  'foschini': 'Shopping & Retail',
  'truworths': 'Shopping & Retail',
  'ackermans': 'Shopping & Retail',
  'jet': 'Shopping & Retail',
  'pep': 'Shopping & Retail',
  
  // Entertainment & Recreation (E&R)
  'gym': 'Entertainment & Recreation',
  'entertainment': 'Entertainment & Recreation',
  'movie': 'Entertainment & Recreation',
  'cinema': 'Entertainment & Recreation',
  'sport': 'Entertainment & Recreation',
  'ster-kinekor': 'Entertainment & Recreation',
  'nu metro': 'Entertainment & Recreation',
  
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
  'showmax': 'Bills & Subscriptions',
  'youtube': 'Bills & Subscriptions',
  'apple': 'Bills & Subscriptions',
  'google': 'Bills & Subscriptions',
  'microsoft': 'Bills & Subscriptions',
  'amazon prime': 'Bills & Subscriptions',
  'claude': 'Bills & Subscriptions',
  'chatgpt': 'Bills & Subscriptions',
  'openai': 'Bills & Subscriptions',
  'prepaid mobile': 'Bills & Subscriptions',
  'voda': 'Bills & Subscriptions',
  'mtn': 'Bills & Subscriptions',
  'telkom': 'Bills & Subscriptions',
  'cellc': 'Bills & Subscriptions',
  
  // Fees
  'fee:': 'Fees',
  'cash withdrawal fee': 'Fees',
  'atm fee': 'Fees',
  'payshap fee': 'Fees',
  
  // Assistance/Lending (person-to-person via PayShap TO)
  'payshap payment to': 'Assistance/Lending',
  'payshap pay by proxy': 'Assistance/Lending',
  
  // Other Income (incoming transfers)
  'salary credit': 'Salary & Wages',
  'salary': 'Salary & Wages',
  'wages': 'Salary & Wages',
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
