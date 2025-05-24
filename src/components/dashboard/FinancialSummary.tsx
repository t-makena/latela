
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNetWorth, getMonthlyIncome, getMonthlyExpenses, getMonthlySavings, formatCurrency } from "@/lib/data";

export const FinancialSummary = () => {
  const netWorth = getNetWorth();
  const monthlyIncome = getMonthlyIncome();
  const monthlyExpenses = getMonthlyExpenses();
  const monthlySavings = getMonthlySavings(); // Now 20% of income
  const netBalance = monthlyIncome - monthlyExpenses - monthlySavings;

  return (
    <Card className="stat-card animate-fade-in">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-lg font-medium text-muted-foreground">
          Financial Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="financial-metric">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Net Balance
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(netBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total income minus expenses and savings
            </p>
          </div>
          
          <div className="financial-metric">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Income
            </div>
            <div className="text-2xl font-bold text-budget-income">
              {formatCurrency(monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly earnings
            </p>
          </div>
          
          <div className="financial-metric">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Expenses
            </div>
            <div className="text-2xl font-bold text-budget-expense">
              {formatCurrency(monthlyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly spending
            </p>
          </div>
          
          <div className="financial-metric">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Savings
            </div>
            <div className="text-2xl font-bold text-budget-secondary">
              {formatCurrency(monthlySavings)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              20% of monthly income
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
