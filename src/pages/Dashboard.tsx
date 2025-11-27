
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { BudgetItemsCard } from "@/components/dashboard/BudgetItemsCard";
import { AvailableBalanceCard } from "@/components/dashboard/AvailableBalanceCard";
import { EnhancedSpendingChart } from "@/components/dashboard/EnhancedSpendingChart";
import { BudgetBreakdown } from "@/components/financial-insight/BudgetBreakdown";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics, formatCurrency } from "@/lib/realData";

const Dashboard = () => {
  const isMobile = useIsMobile();
  const { transactions } = useTransactions();
  const { monthlyIncome, monthlyExpenses, netBalance } = calculateFinancialMetrics(transactions);

  const availableBalance = netBalance;
  const budgetBalance = monthlyIncome * 0.3;
  const spending = monthlyExpenses;

  return (
    <div className="space-y-2 relative z-10">
        <FinancialSummary showExplanations={!isMobile} />
        
        {!isMobile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-2">
            <BudgetItemsCard />
            <AvailableBalanceCard />
          </div>
        )}
        
        {isMobile && (
          <div className="mt-4 px-3">
            <h3 className="text-sm font-semibold mb-2">Budget Insight</h3>
            <BudgetBreakdown
              availableBalance={availableBalance}
              budgetBalance={budgetBalance}
              spending={spending}
              previousMonth={{
                availableBalance: availableBalance * 0.9,
                budgetBalance: budgetBalance * 0.9,
                spending: spending * 0.9,
              }}
              showOnlyTable
            />
          </div>
        )}

        {isMobile ? (
          <div className="mt-2 -mx-3">
            <EnhancedSpendingChart />
          </div>
        ) : (
          <Card className="mt-2">
            <CardContent className="p-0">
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
