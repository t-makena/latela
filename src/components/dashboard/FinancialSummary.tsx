
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics, formatCurrency } from "@/lib/realData";
import { useIsMobile } from "@/hooks/use-mobile";

interface FinancialSummaryProps {
  showExplanations?: boolean;
}

export const FinancialSummary = ({ showExplanations = true }: FinancialSummaryProps) => {
  const { transactions, loading, error } = useTransactions();
  const isMobile = useIsMobile();

  console.log('FinancialSummary - transactions:', transactions);
  console.log('FinancialSummary - loading:', loading);
  console.log('FinancialSummary - error:', error);

  if (loading) {
    const content = (
      <>
        <div className={isMobile ? "pb-1" : "pb-2 pt-4"}>
          <div className={isMobile ? "text-base font-medium text-foreground font-georama" : "text-lg font-medium text-foreground font-georama"}>
            Financial Overview
          </div>
        </div>
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="financial-metric animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </>
    );

    return isMobile ? (
      <div className="animate-fade-in mb-4">{content}</div>
    ) : (
      <Card className="stat-card animate-fade-in">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-lg font-medium text-foreground font-georama">
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
    return isMobile ? (
      <div className="animate-fade-in mb-4">
        <div className="pb-1">
          <div className="text-base font-medium text-foreground font-georama">
            Financial Overview
          </div>
        </div>
        <div>
          <p className="text-destructive">Error loading financial data: {error}</p>
        </div>
      </div>
    ) : (
      <Card className="stat-card animate-fade-in">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-lg font-medium text-foreground font-georama">
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

  const content = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="financial-metric">
          <div className="text-sm font-medium text-muted-foreground mb-1 font-georama">
            Budget Balance<sup className="text-xs ml-1">1</sup>
          </div>
          <div className={isMobile ? "text-xl font-bold font-georama" : "text-2xl font-bold font-georama"}>
            {formatCurrency(netBalance)}
          </div>
        </div>
        
        <div className="financial-metric">
          <div className="text-sm font-medium text-muted-foreground mb-1 font-georama">
            Spending limit for today<sup className="text-xs ml-1">2</sup>
          </div>
          <div className={isMobile ? "text-xl font-bold text-foreground font-georama" : "text-2xl font-bold text-foreground font-georama"}>
            {formatCurrency(dailyTargetSpending)}
          </div>
        </div>
        
        <div className="financial-metric">
          <div className="text-sm font-medium text-muted-foreground mb-1 font-georama">
            Total expenses<sup className="text-xs ml-1">3</sup>
          </div>
          <div className={isMobile ? "text-xl font-bold text-budget-expense font-georama" : "text-2xl font-bold text-budget-expense font-georama"}>
            {formatCurrency(monthlyExpenses)}
          </div>
        </div>
      </div>
      
      {showExplanations && (
        <div className="mt-6 space-y-2 md:space-y-0 md:flex md:gap-6 text-xs text-muted-foreground">
          <p><sup>1</sup> <strong>Budget Balance:</strong> Your available balance after allocating for savings goals</p>
          <p><sup>2</sup> <strong>Spending limit for today:</strong> Daily allowance calculated from your monthly budget ({formatCurrency(monthlyExpenses)} ÷ 30 days)</p>
          <p><sup>3</sup> <strong>Total expenses:</strong> All spending recorded this month</p>
        </div>
      )}
    </>
  );

  return isMobile ? (
    <div className="animate-fade-in mb-4">
      <div className="pb-1 mb-3">
        <div className="text-base font-medium text-foreground font-georama">
          Financial Overview
          {transactions.length === 0 && (
            <span className="text-xs text-orange-500 ml-2">(No transaction data found)</span>
          )}
        </div>
      </div>
      <div>{content}</div>
    </div>
  ) : (
    <Card className="stat-card animate-fade-in">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-lg font-medium text-foreground font-georama">
          Financial Overview
          {transactions.length === 0 && (
            <span className="text-sm text-orange-500 ml-2">(No transaction data found)</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};
