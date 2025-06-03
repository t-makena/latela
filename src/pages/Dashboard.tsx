
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { AccountsOverview } from "@/components/dashboard/AccountsOverview";
import { BudgetGoalsList } from "@/components/dashboard/BudgetGoalsList";
import { EnhancedSpendingChart } from "@/components/dashboard/EnhancedSpendingChart";
import { AIInsights } from "@/components/dashboard/AIInsights";

const Dashboard = () => {
  return (
    <div className="space-y-6">      
      <FinancialSummary />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountsOverview />
        <BudgetGoalsList />
      </div>
      
      <EnhancedSpendingChart />
      
      <div className="grid grid-cols-1 gap-6">
        <AIInsights />
      </div>
    </div>
  );
};

export default Dashboard;
