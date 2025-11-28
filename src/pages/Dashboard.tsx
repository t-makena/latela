
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { BudgetItemsCard } from "@/components/dashboard/BudgetItemsCard";
import { BudgetBreakdown } from "@/components/financial-insight/BudgetBreakdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mt-2">
            <div className="lg:col-span-2">
              <BudgetItemsCard />
            </div>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between pt-4 pb-4">
                <CardTitle className="text-lg">Budget Insight</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
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
