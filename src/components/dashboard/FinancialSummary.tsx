
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNetWorth, getMonthlyIncome, getMonthlyExpenses, formatCurrency } from "@/lib/data";

export const FinancialSummary = () => {
  const netWorth = getNetWorth();
  const monthlyIncome = getMonthlyIncome();
  const monthlyExpenses = getMonthlyExpenses();
  const monthlySavings = monthlyIncome - monthlyExpenses;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="stat-card animate-fade-in">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Net Worth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(netWorth)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total assets minus liabilities
          </p>
        </CardContent>
      </Card>
      
      <Card className="stat-card animate-fade-in" style={{ animationDelay: "100ms" }}>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-budget-income">
            {formatCurrency(monthlyIncome)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Monthly earnings
          </p>
        </CardContent>
      </Card>
      
      <Card className="stat-card animate-fade-in" style={{ animationDelay: "200ms" }}>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-budget-expense">
            {formatCurrency(monthlyExpenses)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Monthly spending
          </p>
        </CardContent>
      </Card>
      
      <Card className="stat-card animate-fade-in" style={{ animationDelay: "300ms" }}>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Savings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-budget-secondary">
            {formatCurrency(monthlySavings)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Income minus expenses
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
