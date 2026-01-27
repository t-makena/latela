import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";

interface Transaction {
  description: string;
  amount: number;
  transaction_date: string;
  type: string;
  category_id?: string | null;
  subcategory_id?: string | null;
  parent_category_name?: string | null;
  subcategory_name?: string | null;
  display_subcategory_name?: string | null;
  display_subcategory_color?: string | null;
  subcategory_color?: string | null;
  parent_category_color?: string | null;
}

interface BudgetBreakdownProps {
  availableBalance: number;
  budgetBalance: number;
  spending: number;
  previousMonth: {
    availableBalance: number;
    budgetBalance: number;
    spending: number;
  };
  threeMonthsAgo?: {
    availableBalance: number;
    budgetBalance: number;
    spending: number;
  };
  sixMonthsAgo?: {
    availableBalance: number;
    budgetBalance: number;
    spending: number;
  };
  oneYearAgo?: {
    availableBalance: number;
    budgetBalance: number;
    spending: number;
  };
  showOnlyPieChart?: boolean;
  showOnlyTable?: boolean;
  showOnlyOneMonth?: boolean;
  transactions?: Transaction[];
  isDetailed?: boolean;
}

export const BudgetBreakdown = ({ 
  availableBalance, 
  budgetBalance, 
  spending,
  previousMonth,
  threeMonthsAgo,
  sixMonthsAgo,
  oneYearAgo,
  showOnlyPieChart = false,
  showOnlyTable = false,
  showOnlyOneMonth = false,
  transactions = [],
  isDetailed: externalIsDetailed
}: BudgetBreakdownProps) => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const [internalIsDetailed, setInternalIsDetailed] = useState(false);
  
  // Use external isDetailed if provided, otherwise use internal state
  const isDetailed = externalIsDetailed !== undefined ? externalIsDetailed : internalIsDetailed;
  const setIsDetailed = externalIsDetailed !== undefined ? () => {} : setInternalIsDetailed;
  
  // Calculate percentage changes for 1 month
  const availableChange = previousMonth.availableBalance 
    ? ((availableBalance - previousMonth.availableBalance) / previousMonth.availableBalance * 100).toFixed(0)
    : 0;
  const budgetChange = previousMonth.budgetBalance
    ? ((budgetBalance - previousMonth.budgetBalance) / previousMonth.budgetBalance * 100).toFixed(0)
    : 0;
  const spendingChange = previousMonth.spending
    ? ((spending - previousMonth.spending) / previousMonth.spending * 100).toFixed(0)
    : 0;

  // Calculate percentage changes for 3 months
  const available3MChange = threeMonthsAgo?.availableBalance 
    ? ((availableBalance - threeMonthsAgo.availableBalance) / threeMonthsAgo.availableBalance * 100).toFixed(0)
    : 0;
  const budget3MChange = threeMonthsAgo?.budgetBalance
    ? ((budgetBalance - threeMonthsAgo.budgetBalance) / threeMonthsAgo.budgetBalance * 100).toFixed(0)
    : 0;
  const spending3MChange = threeMonthsAgo?.spending
    ? ((spending - threeMonthsAgo.spending) / threeMonthsAgo.spending * 100).toFixed(0)
    : 0;

  // Calculate percentage changes for 6 months
  const available6MChange = sixMonthsAgo?.availableBalance 
    ? ((availableBalance - sixMonthsAgo.availableBalance) / sixMonthsAgo.availableBalance * 100).toFixed(0)
    : 0;
  const budget6MChange = sixMonthsAgo?.budgetBalance
    ? ((budgetBalance - sixMonthsAgo.budgetBalance) / sixMonthsAgo.budgetBalance * 100).toFixed(0)
    : 0;
  const spending6MChange = sixMonthsAgo?.spending
    ? ((spending - sixMonthsAgo.spending) / sixMonthsAgo.spending * 100).toFixed(0)
    : 0;

  // Calculate percentage changes for 1 year
  const available1YChange = oneYearAgo?.availableBalance 
    ? ((availableBalance - oneYearAgo.availableBalance) / oneYearAgo.availableBalance * 100).toFixed(0)
    : 0;
  const budget1YChange = oneYearAgo?.budgetBalance
    ? ((budgetBalance - oneYearAgo.budgetBalance) / oneYearAgo.budgetBalance * 100).toFixed(0)
    : 0;
  const spending1YChange = oneYearAgo?.spending
    ? ((spending - oneYearAgo.spending) / oneYearAgo.spending * 100).toFixed(0)
    : 0;

  // Parent category colors (for simple view)
  const parentCategoryColors: Record<string, string> = {
    "Income": "#10B981",        // Green
    "Necessities": "#3B82F6",   // Blue
    "Discretionary": "#f85f00", // Orange
    "Savings": "#8B5CF6"        // Purple
  };

  // Subcategory colors (for detailed view)
  const subcategoryColors: Record<string, string> = {
    // Income subcategories
    "Salary & Wages": "#10B981",
    "Bonuses & Commissions": "#34D399",
    "Refunds & Reimbursements": "#6EE7B7",
    "Other Income": "#A7F3D0",
    // Necessities subcategories
    "Housing & Utilities": "#3B82F6",
    "Food & Groceries": "#84CC16",
    "Transportation & Fuel": "#F59E0B",
    "Healthcare & Medical": "#EF4444",
    "Bills & Subscriptions": "#6B7280",
    "Fees": "#9CA3AF",
    // Discretionary subcategories
    "Personal & Lifestyle": "#8B5CF6",
    "Dining & Restaurants": "#EC4899",
    "Shopping & Retail": "#A855F7",
    "Entertainment & Recreation": "#F97316",
    "Assistance/Lending": "#FB923C",
    "Offertory/Charity": "#FBBF24",
    "Miscellaneous": "#06B6D4",
    // Savings subcategories
    "Savings & Investments": "#8B5CF6"
  };

  // Calculate simple category breakdown (parent categories) from transactions
  const getSimpleCategoryData = () => {
    const parentCategoryTotals: Record<string, number> = {
      "Income": 0,
      "Necessities": 0,
      "Discretionary": 0,
      "Savings": 0
    };

    transactions.forEach(transaction => {
      // Only count expenses for spending allocation (excluding income)
      if (transaction.type === 'expense' && transaction.parent_category_name) {
        const amount = Math.abs(transaction.amount);
        const parentCategory = transaction.parent_category_name;
        if (parentCategoryTotals.hasOwnProperty(parentCategory)) {
          parentCategoryTotals[parentCategory] += amount;
        }
      }
    });

    const categoryData = Object.entries(parentCategoryTotals)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: parentCategoryColors[name] || "#06B6D4"
      }));

    return categoryData;
  };

  // Calculate detailed category breakdown (subcategories) from transactions
  const getDetailedCategoryData = () => {
    const subcategoryTotals: Record<string, { value: number; color: string }> = {};

    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        // Use display_subcategory_name first (which includes custom categories), 
        // then fall back to subcategory_name
        const subcategoryName = transaction.display_subcategory_name || 
                                transaction.subcategory_name || 
                                'Miscellaneous';
        const amount = Math.abs(transaction.amount);
        
        // Get color from transaction data or use default from our mapping
        const color = transaction.display_subcategory_color || 
                      transaction.subcategory_color || 
                      subcategoryColors[subcategoryName] || 
                      "#06B6D4";

        if (!subcategoryTotals[subcategoryName]) {
          subcategoryTotals[subcategoryName] = { value: 0, color };
        }
        subcategoryTotals[subcategoryName].value += amount;
      }
    });

    const detailedData = Object.entries(subcategoryTotals)
      .filter(([_, data]) => data.value > 0)
      .map(([name, data]) => ({
        name,
        value: data.value,
        color: data.color
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending

    return detailedData;
  };

  const simplePieData = getSimpleCategoryData();
  const detailedPieData = getDetailedCategoryData();
  const pieData = isDetailed ? detailedPieData : simplePieData;
  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = (entry: any) => {
    const percent = ((entry.value / total) * 100).toFixed(2);
    // Only show label if slice is large enough (>3% to avoid overlap)
    if (parseFloat(percent) > 3) {
      return `${percent}%`;
    }
    return '';
  };

  if (showOnlyPieChart) {
    return (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Pie Chart */}
        <div className="flex-shrink-0 lg:w-[400px]">
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={isMobile ? 60 : 120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('finance.category')}</TableHead>
                <TableHead className="text-right">{t('budget.amount')}</TableHead>
                <TableHead className="text-right">{t('finance.percentage')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pieData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </TableCell>
                  <TableCell className="text-right">R{item.value.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{((item.value / total) * 100).toFixed(2)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (showOnlyTable) {
    if (showOnlyOneMonth) {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">{t('budget.metric')}</TableHead>
              <TableHead className="text-right">{t('budget.oneMonthChange')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium py-3">{t('finance.availableBalance')}</TableCell>
              <TableCell className={`text-right font-semibold py-3 ${Number(availableChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(availableChange) >= 0 ? '+' : ''}{availableChange}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium py-3">{t('finance.budgetBalance')}</TableCell>
              <TableCell className={`text-right font-semibold py-3 ${Number(budgetChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(budgetChange) >= 0 ? '+' : ''}{budgetChange}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium py-3">{t('finance.spending')}</TableCell>
              <TableCell className={`text-right font-semibold py-3 ${Number(spendingChange) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(spendingChange) >= 0 ? '+' : ''}{spendingChange}%
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
    }

    return (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">{t('budget.metric')}</TableHead>
              <TableHead className="text-right">{t('budget.oneMonthChange')}</TableHead>
              <TableHead className="text-right">{t('budget.threeMonthChange')}</TableHead>
              <TableHead className="text-right">{t('budget.sixMonthChange')}</TableHead>
              <TableHead className="text-right">{t('budget.oneYearChange')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">{t('finance.availableBalance')}</TableCell>
              <TableCell className={`text-right font-semibold ${Number(availableChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(availableChange) >= 0 ? '+' : ''}{availableChange}%
              </TableCell>
              <TableCell className={`text-right font-semibold ${Number(available3MChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(available3MChange) >= 0 ? '+' : ''}{available3MChange}%
              </TableCell>
              <TableCell className={`text-right font-semibold ${Number(available6MChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(available6MChange) >= 0 ? '+' : ''}{available6MChange}%
              </TableCell>
              <TableCell className={`text-right font-semibold ${Number(available1YChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(available1YChange) >= 0 ? '+' : ''}{available1YChange}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">{t('finance.budgetBalance')}</TableCell>
              <TableCell className={`text-right font-semibold ${Number(budgetChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(budgetChange) >= 0 ? '+' : ''}{budgetChange}%
              </TableCell>
              <TableCell className={`text-right font-semibold ${Number(budget3MChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(budget3MChange) >= 0 ? '+' : ''}{budget3MChange}%
              </TableCell>
              <TableCell className={`text-right font-semibold ${Number(budget6MChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(budget6MChange) >= 0 ? '+' : ''}{budget6MChange}%
              </TableCell>
              <TableCell className={`text-right font-semibold ${Number(budget1YChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(budget1YChange) >= 0 ? '+' : ''}{budget1YChange}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">{t('finance.spending')}</TableCell>
              <TableCell className={`text-right font-semibold ${Number(spendingChange) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(spendingChange) >= 0 ? '+' : ''}{spendingChange}%
              </TableCell>
              <TableCell className={`text-right font-semibold ${Number(spending3MChange) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(spending3MChange) >= 0 ? '+' : ''}{spending3MChange}%
              </TableCell>
              <TableCell className={`text-right font-semibold ${Number(spending6MChange) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(spending6MChange) >= 0 ? '+' : ''}{spending6MChange}%
              </TableCell>
              <TableCell className={`text-right font-semibold ${Number(spending1YChange) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(spending1YChange) >= 0 ? '+' : ''}{spending1YChange}%
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Insight Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">{t('finance.budgetInsight')}</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">{t('budget.metric')}</TableHead>
              <TableHead className="text-right">{t('budget.oneMonthChange')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">{t('finance.availableBalance')}</TableCell>
              <TableCell className={`text-right font-semibold ${Number(availableChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(availableChange) >= 0 ? '+' : ''}{availableChange}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">{t('finance.budgetBalance')}</TableCell>
              <TableCell className={`text-right font-semibold ${Number(budgetChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(budgetChange) >= 0 ? '+' : ''}{budgetChange}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">{t('finance.spending')}</TableCell>
              <TableCell className={`text-right font-semibold ${Number(spendingChange) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(spendingChange) >= 0 ? '+' : ''}{spendingChange}%
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Budget Pie Chart */}
      <div>
        <h3 className="text-sm font-semibold mb-3">{t('finance.budgetAllocation')}</h3>
        <ResponsiveContainer width="100%" height={isMobile ? 250 : 450}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={isMobile ? 60 : 140}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend 
              layout={isMobile ? "horizontal" : "vertical"}
              align={isMobile ? "center" : "left"}
              verticalAlign={isMobile ? "bottom" : "middle"}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDetailed(!isDetailed)}
          >
            {isDetailed ? t('finance.simple') : t('finance.detailed')}
          </Button>
        </div>
      </div>
    </div>
  );
};
