import { startOfDay, endOfDay } from "date-fns";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { DateFilterOption } from "@/components/common/DateFilter";
import { getDateRangeForFilter, DateRange } from "@/lib/dateFilterUtils";
import { SUBCATEGORY_NAME_TO_BUDGET_CATEGORY } from "@/lib/categoryMapping";

interface Transaction {
  description: string;
  amount: number;
  transaction_date: string;
  
  category_id?: string | null;
  subcategory_id?: string | null;
  parent_category_name?: string | null;
  subcategory_name?: string | null;
  display_subcategory_name?: string | null;
  display_subcategory_color?: string | null;
  subcategory_color?: string | null;
  parent_category_color?: string | null;
}

interface ComparisonPeriod {
  availableBalance: number | null;
  budgetBalance: number | null;
  spending: number | null;
}

interface BudgetBreakdownProps {
  availableBalance: number;
  budgetBalance: number;
  spending: number;
  previousMonth: ComparisonPeriod | null;
  threeMonthsAgo?: ComparisonPeriod | null;
  sixMonthsAgo?: ComparisonPeriod | null;
  oneYearAgo?: ComparisonPeriod | null;
  showOnlyPieChart?: boolean;
  showOnlyTable?: boolean;
  showOnlyOneMonth?: boolean;
  transactions?: Transaction[];
  isDetailed?: boolean;
  dateFilter?: DateFilterOption;
  customDateRange?: DateRange;
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
  isDetailed: externalIsDetailed,
  dateFilter,
  customDateRange
}: BudgetBreakdownProps) => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const [internalIsDetailed, setInternalIsDetailed] = useState(false);
  
  // Use external isDetailed if provided, otherwise use internal state
  const isDetailed = externalIsDetailed !== undefined ? externalIsDetailed : internalIsDetailed;
  const setIsDetailed = externalIsDetailed !== undefined ? () => {} : setInternalIsDetailed;

  // Filter transactions by date if dateFilter is provided
  const filteredTransactions = (() => {
    if (!dateFilter) return transactions;
    const range = customDateRange ? { from: customDateRange.from, to: customDateRange.to } : getDateRangeForFilter(dateFilter);
    return transactions.filter(t => {
      const d = new Date(t.transaction_date);
      return d >= startOfDay(range.from) && d <= endOfDay(range.to);
    });
  })();


  const calcChange = (current: number, previous: number | null | undefined): string | null => {
    if (previous === null || previous === undefined || previous === 0) return null;
    return ((current - previous) / previous * 100).toFixed(0);
  };

  // 1 month changes
  const availableChange = calcChange(availableBalance, previousMonth?.availableBalance);
  const budgetChange = calcChange(budgetBalance, previousMonth?.budgetBalance);
  const spendingChange = calcChange(spending, previousMonth?.spending);

  // 3 month changes
  const available3MChange = calcChange(availableBalance, threeMonthsAgo?.availableBalance);
  const budget3MChange = calcChange(budgetBalance, threeMonthsAgo?.budgetBalance);
  const spending3MChange = calcChange(spending, threeMonthsAgo?.spending);

  // 6 month changes
  const available6MChange = calcChange(availableBalance, sixMonthsAgo?.availableBalance);
  const budget6MChange = calcChange(budgetBalance, sixMonthsAgo?.budgetBalance);
  const spending6MChange = calcChange(spending, sixMonthsAgo?.spending);

  // 1 year changes
  const available1YChange = calcChange(availableBalance, oneYearAgo?.availableBalance);
  const budget1YChange = calcChange(budgetBalance, oneYearAgo?.budgetBalance);
  const spending1YChange = calcChange(spending, oneYearAgo?.spending);

  // Render helper for change cells - shows "N/A" for null values
  const renderChange = (change: string | null, invertColor = false) => {
    if (change === null) {
      return <span className="text-muted-foreground">N/A</span>;
    }
    const num = Number(change);
    const isPositive = invertColor ? num <= 0 : num >= 0;
    return (
      <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
        {num >= 0 ? '+' : ''}{change}%
      </span>
    );
  };


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
    "Healthcare & Medical": "#ff3132",
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

    filteredTransactions.forEach(transaction => {
      // Only count expenses for spending allocation (excluding income)
      if (transaction.amount < 0 && transaction.parent_category_name) {
        const amount = Math.abs(transaction.amount);
        const parentCategory = transaction.parent_category_name;
        // Map mid-level name to parent bucket
        const mapped = SUBCATEGORY_NAME_TO_BUDGET_CATEGORY[parentCategory];
        const parentBucket = mapped === 'needs' ? 'Necessities'
                           : mapped === 'wants' ? 'Discretionary'
                           : mapped === 'savings' ? 'Savings'
                           : mapped === 'income' ? 'Income'
                           : parentCategory; // fallback to original name
        if (parentBucket && parentCategoryTotals.hasOwnProperty(parentBucket)) {
          parentCategoryTotals[parentBucket] += amount;
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

    filteredTransactions.forEach(transaction => {
      if (transaction.amount < 0) {
        // Use display_subcategory_name first (which includes custom categories), 
        // then fall back to subcategory_name
        const subcategoryName = transaction.display_subcategory_name || 
                                transaction.subcategory_name || 
                                transaction.parent_category_name ||
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
              <TableHead className="text-right">Current Amount</TableHead>
              <TableHead className="text-right">{t('budget.oneMonthChange')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium py-3">{t('finance.availableBalance')}</TableCell>
              <TableCell className="text-right font-medium py-3">R{availableBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell className="text-right font-semibold py-3">
                {renderChange(availableChange)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium py-3">{t('finance.budgetBalance')}</TableCell>
              <TableCell className="text-right font-medium py-3">R{budgetBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell className="text-right font-semibold py-3">
                {renderChange(budgetChange)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium py-3">{t('finance.spending')}</TableCell>
              <TableCell className="text-right font-medium py-3">R{spending.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell className="text-right font-semibold py-3">
                {renderChange(spendingChange, true)}
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
              <TableHead className="text-right">Current Amount</TableHead>
              <TableHead className="text-right">{t('budget.oneMonthChange')}</TableHead>
              <TableHead className="text-right">{t('budget.threeMonthChange')}</TableHead>
              <TableHead className="text-right">{t('budget.sixMonthChange')}</TableHead>
              <TableHead className="text-right">{t('budget.oneYearChange')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">{t('finance.availableBalance')}</TableCell>
              <TableCell className="text-right font-medium">R{availableBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell className="text-right font-semibold">{renderChange(availableChange)}</TableCell>
              <TableCell className="text-right font-semibold">{renderChange(available3MChange)}</TableCell>
              <TableCell className="text-right font-semibold">{renderChange(available6MChange)}</TableCell>
              <TableCell className="text-right font-semibold">{renderChange(available1YChange)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">{t('finance.budgetBalance')}</TableCell>
              <TableCell className="text-right font-medium">R{budgetBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell className="text-right font-semibold">{renderChange(budgetChange)}</TableCell>
              <TableCell className="text-right font-semibold">{renderChange(budget3MChange)}</TableCell>
              <TableCell className="text-right font-semibold">{renderChange(budget6MChange)}</TableCell>
              <TableCell className="text-right font-semibold">{renderChange(budget1YChange)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">{t('finance.spending')}</TableCell>
              <TableCell className="text-right font-medium">R{spending.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell className="text-right font-semibold">{renderChange(spendingChange, true)}</TableCell>
              <TableCell className="text-right font-semibold">{renderChange(spending3MChange, true)}</TableCell>
              <TableCell className="text-right font-semibold">{renderChange(spending6MChange, true)}</TableCell>
              <TableCell className="text-right font-semibold">{renderChange(spending1YChange, true)}</TableCell>
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
              <TableCell className="text-right font-semibold">{renderChange(availableChange)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">{t('finance.budgetBalance')}</TableCell>
              <TableCell className="text-right font-semibold">{renderChange(budgetChange)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">{t('finance.spending')}</TableCell>
              <TableCell className="text-right font-semibold">{renderChange(spendingChange, true)}</TableCell>
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
