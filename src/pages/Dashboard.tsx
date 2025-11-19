
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { AccountsOverview } from "@/components/dashboard/AccountsOverview";
import { BudgetGoalsList } from "@/components/dashboard/BudgetGoalsList";
import { EnhancedSpendingChart } from "@/components/dashboard/EnhancedSpendingChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics, formatCurrency } from "@/lib/realData";

const Dashboard = () => {
  const isMobile = useIsMobile();
  const { transactions } = useTransactions();
  const { monthlyExpenses } = calculateFinancialMetrics(transactions);

  return (
    <div className="space-y-2 relative z-10">
        <FinancialSummary showExplanations={!isMobile} />
        
        {!isMobile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-2">
            <AccountsOverview />
            <BudgetGoalsList />
          </div>
        )}
        
        {isMobile ? (
          <div className="mt-2 -mx-3">
            <div className="pb-2 mb-2 px-3">
              <div className="text-base font-georama">Spending Trend</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">for the past month</p>
            </div>
            <div>
              <EnhancedSpendingChart />
            </div>
          </div>
        ) : (
          <Card className="mt-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-georama">Spending Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <EnhancedSpendingChart />
            </CardContent>
          </Card>
        )}
        
        {isMobile && (
          <div className="mt-6 space-y-2 text-xs text-muted-foreground px-3">
            <p><sup>1</sup> <strong>Budget Balance:</strong> Available balance less budget savings</p>
            <p><sup>2</sup> <strong>Spending limit for today:</strong> Target spending for the month: {formatCurrency(monthlyExpenses)}</p>
            <p><sup>3</sup> <strong>Total expenses:</strong> Total spending this month</p>
          </div>
        )}
    </div>
  );
};

export default Dashboard;
