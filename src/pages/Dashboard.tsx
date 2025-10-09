
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { AccountsOverview } from "@/components/dashboard/AccountsOverview";
import { BudgetGoalsList } from "@/components/dashboard/BudgetGoalsList";

const Dashboard = () => {
  return (
    <div className="space-y-2 relative z-10">
        <FinancialSummary />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-2">
          <AccountsOverview />
          <BudgetGoalsList />
        </div>
    </div>
  );
};

export default Dashboard;
