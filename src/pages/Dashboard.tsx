import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { BudgetItemsCard } from "@/components/dashboard/BudgetItemsCard";
import { BudgetBreakdown } from "@/components/financial-insight/BudgetBreakdown";
import { MobileBudgetPlanCard } from "@/components/dashboard/MobileBudgetPlanCard";
import { MobileBudgetInsightCard } from "@/components/accounts/MobileBudgetInsightCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics, formatCurrency } from "@/lib/realData";
import { useLanguage } from "@/hooks/useLanguage";
import { GoalsSavingsBalanceChart } from "@/components/goals/GoalsSavingsBalanceChart";
import { LatelaScoreCard } from "@/components/budget/LatelaScoreCard";
import { MonthEndReviewDialog } from "@/components/goals/MonthEndReviewDialog";

const Dashboard = () => {
  const isMobile = useIsMobile();
  const { transactions } = useTransactions();
  const { monthlyIncome, monthlyExpenses, netBalance } = calculateFinancialMetrics(transactions);
  const { t } = useLanguage();

  const availableBalance = netBalance;
  const budgetBalance = monthlyIncome * 0.3;
  const spending = monthlyExpenses;

  // Minimal mobile view
  if (isMobile) {
    return (
      <div className="min-h-screen py-6 space-y-5 animate-fade-in">
        <FinancialSummary showExplanations={false} minimal={true} />
        {/* Latela Score Card - Compact for mobile */}
        <div className="px-4">
          <LatelaScoreCard compact />
        </div>
        <MobileBudgetPlanCard />
        <MobileBudgetInsightCard />
        {/* Combined Savings Balance Chart with Status */}
        <div className="px-4">
          <GoalsSavingsBalanceChart compact />
        </div>
      </div>
    );
  }

  // Desktop view
  return (
    <div className="space-y-6 relative z-10 pt-6 pb-4 px-6">
      {/* Month-End Review Dialog */}
      <MonthEndReviewDialog />
      <FinancialSummary showExplanations={true} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 items-stretch">
        <div className="lg:col-span-2 h-full">
          <BudgetItemsCard />
        </div>
        {/* Latela Score Card for desktop */}
        <LatelaScoreCard />
      </div>

      {/* Savings Balance Chart with Status */}
      <div className="mt-4">
        <GoalsSavingsBalanceChart />
      </div>
    </div>
  );
};

export default Dashboard;
