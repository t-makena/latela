
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics, formatCurrency } from "@/lib/realData";

export const FinancialSummary = () => {
  const { transactions, loading, error } = useTransactions();

  console.log('FinancialSummary - transactions:', transactions);
  console.log('FinancialSummary - loading:', loading);
  console.log('FinancialSummary - error:', error);

  if (loading) {
    return (
      <Card className="stat-card animate-fade-in">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-lg font-medium text-muted-foreground font-georama">
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
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
          <CardTitle className="text-lg font-medium text-muted-foreground font-georama">
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading financial data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // Add debug log before calculations
  console.log('About to calculate metrics with transactions:', transactions);
  
  const { monthlyIncome, monthlyExpenses, netBalance } = calculateFinancialMetrics(transactions);

  // Debug log after calculations
  console.log('Calculated metrics:', { monthlyIncome, monthlyExpenses, netBalance });

  // Calculate daily target spending (monthly expenses / 30 days)
  const dailyTargetSpending = monthlyExpenses / 30;

  return (
    <Card className="stat-card animate-fade-in">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-lg font-medium text-muted-foreground font-georama">
          Financial Overview
          {transactions.length === 0 && (
            <span className="text-sm text-orange-500 ml-2">(No transaction data found)</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="financial-metric">
            <div className="text-sm font-medium text-muted-foreground mb-1 font-georama">
              Net Balance
            </div>
            <div className="text-2xl font-bold font-georama">
              {formatCurrency(netBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total of all transaction values
            </p>
          </div>
          
          <div className="financial-metric">
            <div className="text-sm font-medium text-muted-foreground mb-1 font-georama">
              Target spending for today
            </div>
            <div className="text-2xl font-bold text-black font-georama">
              {formatCurrency(dailyTargetSpending)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target spending for the month: {formatCurrency(monthlyExpenses)}
            </p>
          </div>
          
          <div className="financial-metric">
            <div className="text-sm font-medium text-muted-foreground mb-1 font-georama">
              Expenses
            </div>
            <div className="text-2xl font-bold text-budget-expense font-georama">
              {formatCurrency(monthlyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total negative values
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
