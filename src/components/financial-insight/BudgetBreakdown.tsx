import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { categorizeTransaction } from "@/lib/transactionCategories";

interface Transaction {
  description: string;
  amount: number;
  transaction_date: string;
  type: string;
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

  // Category color mapping
  const categoryColors: Record<string, string> = {
    "Housing & Utilities": "#3B82F6",
    "Savings & Investments": "#10B981",
    "Personal & Lifestyle": "#8B5CF6",
    "Food & Groceries": "#84CC16",
    "Transportation & Fuel": "#F59E0B",
    "Dining & Restaurants": "#EC4899",
    "Shopping & Retail": "#A855F7",
    "Entertainment & Recreation": "#F97316",
    "Healthcare & Medical": "#EF4444",
    "Bills & Subscriptions": "#6B7280",
    "Miscellaneous": "#06B6D4"
  };

  // Calculate detailed category breakdown from transactions
  const getDetailedCategoryData = () => {
    const categoryTotals: Record<string, number> = {
      "Housing & Utilities": 0,
      "Food & Groceries": 0,
      "Bills & Subscriptions": 0,
      "Healthcare & Medical": 0,
      "Personal & Lifestyle": 0,
      "Transportation & Fuel": 0,
      "Shopping & Retail": 0,
      "Dining & Restaurants": 0,
      "Entertainment & Recreation": 0,
      "Savings & Investments": 0,
      "Miscellaneous": 0
    };

    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const category = categorizeTransaction(transaction.description || '');
        const amount = Math.abs(transaction.amount) / 100;
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      }
    });

    const detailedData = Object.entries(categoryTotals)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: categoryColors[name] || "#06B6D4"
      }));

    // Add Available Balance and Budget Balance to detailed view
    return [
      { name: "Available Balance", value: availableBalance, color: "#9CA3AF" },
      { name: "Budget Balance", value: budgetBalance, color: "#EF4444" },
      ...detailedData
    ];
  };

  // Simple pie chart data
  const simplePieData = [
    { name: "Available Balance", value: availableBalance, color: "#9CA3AF" },
    { name: "Budget Balance", value: budgetBalance, color: "#EF4444" },
    { name: "Necessities", value: spending * 0.4055, color: "#3B82F6" },
    { name: "Discretionary", value: spending * 0.2845, color: "#F97316" },
    { name: "Savings", value: spending * 0.20, color: "#10B981" }
  ];

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
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
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
        <div className="h-full flex items-center">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] h-12">Metric</TableHead>
                <TableHead className="text-right h-12">1 Mth Chng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium h-16">Available Balance</TableCell>
                <TableCell className={`text-right font-semibold h-16 ${Number(availableChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Number(availableChange) >= 0 ? '+' : ''}{availableChange}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium h-16">Budget Balance</TableCell>
                <TableCell className={`text-right font-semibold h-16 ${Number(budgetChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Number(budgetChange) >= 0 ? '+' : ''}{budgetChange}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium h-16">Spending</TableCell>
                <TableCell className={`text-right font-semibold h-16 ${Number(spendingChange) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Number(spendingChange) >= 0 ? '+' : ''}{spendingChange}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      );
    }

    return (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Metric</TableHead>
              <TableHead className="text-right">1 Mth Chng</TableHead>
              <TableHead className="text-right">3 Mth Chng</TableHead>
              <TableHead className="text-right">6 Mth Chng</TableHead>
              <TableHead className="text-right">1 Yr Chng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Available Balance</TableCell>
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
              <TableCell className="font-medium">Budget Balance</TableCell>
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
              <TableCell className="font-medium">Spending</TableCell>
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
        <h3 className="text-sm font-semibold mb-3">Budget Insight</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Metric</TableHead>
              <TableHead className="text-right">1 Mth Chng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Available Balance</TableCell>
              <TableCell className={`text-right font-semibold ${Number(availableChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(availableChange) >= 0 ? '+' : ''}{availableChange}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Budget Balance</TableCell>
              <TableCell className={`text-right font-semibold ${Number(budgetChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(budgetChange) >= 0 ? '+' : ''}{budgetChange}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Spending</TableCell>
              <TableCell className={`text-right font-semibold ${Number(spendingChange) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(spendingChange) >= 0 ? '+' : ''}{spendingChange}%
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Budget Pie Chart */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Budget Allocation</h3>
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
              verticalAlign={isMobile ? "bottom" : "top"}
              iconType="circle"
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
