
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { BudgetItemsCard } from "@/components/dashboard/BudgetItemsCard";
import { BudgetBreakdown } from "@/components/financial-insight/BudgetBreakdown";
import { MobileBudgetPlanCard } from "@/components/dashboard/MobileBudgetPlanCard";
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

  // Minimal mobile view
  if (isMobile) {
    return (
      <div className="min-h-screen bg-white px-6 py-6 space-y-5 animate-fade-in">
        <FinancialSummary showExplanations={false} minimal={true} />
        <MobileBudgetPlanCard />
      </div>
    );
  }

  // Desktop view
  return (
    <div className="space-y-2 relative z-10 pb-4">
      <FinancialSummary showExplanations={true} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mt-2 items-start">
        <div className="lg:col-span-2">
          <BudgetItemsCard />
        </div>
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between pt-4 pb-4">
            <CardTitle className="text-lg">Budget Insight</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center pb-6">
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
              showOnlyOneMonth
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
