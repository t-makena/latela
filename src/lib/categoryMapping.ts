// Category mapping utility for budget limit validation
// Maps parent categories to budget allocation types (Needs/Wants/Savings)

export type BudgetCategory = 'needs' | 'wants' | 'savings' | 'income';

// Parent category IDs from the database
export const PARENT_CATEGORY_IDS = {
  NECESSITIES: 'c5de45f5-6e87-4382-a3e1-9fa70e7da715',
  DISCRETIONARY: '1ff56fb5-4def-402e-92ae-4026868cff63',
  SAVINGS: '64fd29bb-d01a-4baa-869a-ff6892b02ef1',
  INCOME: 'd8c931e2-88e9-4451-ade6-09f0de1034c0',
} as const;

// Map parent category IDs to budget categories
export const PARENT_TO_BUDGET_CATEGORY: Record<string, BudgetCategory> = {
  [PARENT_CATEGORY_IDS.NECESSITIES]: 'needs',
  [PARENT_CATEGORY_IDS.DISCRETIONARY]: 'wants',
  [PARENT_CATEGORY_IDS.SAVINGS]: 'savings',
  [PARENT_CATEGORY_IDS.INCOME]: 'income',
};

// Map parent category names to budget categories (fallback for name-based matching)
export const PARENT_NAME_TO_BUDGET_CATEGORY: Record<string, BudgetCategory> = {
  'Necessities': 'needs',
  'Discretionary': 'wants',
  'Savings': 'savings',
  'Income': 'income',
};

// Get display name for budget category
export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  needs: 'Needs',
  wants: 'Wants',
  savings: 'Savings',
  income: 'Income',
};

export interface Subcategory {
  id: string;
  name: string;
  parent_category_id?: string;
  parent_category_name?: string;
}

/**
 * Determines which budget category a subcategory belongs to
 * @param subcategory - The subcategory to check
 * @returns The budget category ('needs', 'wants', 'savings') or null if not applicable
 */
export const getBudgetCategoryForSubcategory = (
  subcategory: Subcategory
): BudgetCategory | null => {
  // First try by parent_category_id
  if (subcategory.parent_category_id) {
    const category = PARENT_TO_BUDGET_CATEGORY[subcategory.parent_category_id];
    if (category) return category;
  }

  // Fallback to name-based matching
  if (subcategory.parent_category_name) {
    const category = PARENT_NAME_TO_BUDGET_CATEGORY[subcategory.parent_category_name];
    if (category) return category;
  }

  return null;
};

/**
 * Get the parent category ID for a budget category type
 */
export const getParentCategoryId = (budgetCategory: BudgetCategory): string | null => {
  switch (budgetCategory) {
    case 'needs':
      return PARENT_CATEGORY_IDS.NECESSITIES;
    case 'wants':
      return PARENT_CATEGORY_IDS.DISCRETIONARY;
    case 'savings':
      return PARENT_CATEGORY_IDS.SAVINGS;
    default:
      return null;
  }
};

/**
 * Calculate budget limits based on available balance and percentages
 */
export interface CategoryLimits {
  needs: number;
  wants: number;
  savings: number;
}

export const calculateCategoryLimits = (
  availableBalance: number,
  needsPercentage: number,
  wantsPercentage: number,
  savingsPercentage: number
): CategoryLimits => ({
  needs: (needsPercentage / 100) * availableBalance,
  wants: (wantsPercentage / 100) * availableBalance,
  savings: (savingsPercentage / 100) * availableBalance,
});
