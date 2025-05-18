
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { AccountsOverview } from "@/components/dashboard/AccountsOverview";
import { BudgetGoalsList } from "@/components/dashboard/BudgetGoalsList";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { formatCurrency, getNetWorth } from "@/lib/data";

const Dashboard = () => {
  const netWorth = getNetWorth();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome to FinanceAI</h1>
        <p className="text-muted-foreground">
          Your net worth: <span className="font-semibold">{formatCurrency(netWorth)}</span>
        </p>
      </div>
      
      <FinancialSummary />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountsOverview />
        <BudgetGoalsList />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingChart type="line" />
        <SpendingChart type="pie" />
      </div>
      
      <AIInsights />
    </div>
  );
};

export default Dashboard;
