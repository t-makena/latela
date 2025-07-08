
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { AccountsOverview } from "@/components/dashboard/AccountsOverview";
import { BudgetGoalsList } from "@/components/dashboard/BudgetGoalsList";
import { EnhancedSpendingChart } from "@/components/dashboard/EnhancedSpendingChart";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="space-y-6">      
      <FinancialSummary />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountsOverview />
        <BudgetGoalsList />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-georama">Spending Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <div className="min-w-full md:min-w-0">
              <EnhancedSpendingChart />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 gap-6">
        <AIInsights />
      </div>
    </div>
  );
};

export default Dashboard;
