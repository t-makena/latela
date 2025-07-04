
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics, formatCurrency } from "@/lib/realData";

export const FinancialSummary = () => {
  const { transactions, loading, error } = useTransactions();

  if (loading) {
    return (
      <Card className="stat-card animate-fade-in">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-lg font-medium text-muted-foreground">
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="financial-metric animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="stat-card animate-fade-in">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-lg font-medium text-muted-foreground">
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading financial data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const { monthlyIncome, monthlyExpenses, monthlySavings, netBalance } = calculateFinancialMetrics(transactions);

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
              Total of all transaction values
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
              Monthly salary deposits
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
              Total negative values
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
              Transfers from cheque minus transfers from savings
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
