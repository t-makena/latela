
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { AccountsOverview } from "@/components/dashboard/AccountsOverview";
import { BudgetGoalsList } from "@/components/dashboard/BudgetGoalsList";
import { EnhancedSpendingChart } from "@/components/dashboard/EnhancedSpendingChart";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-3">      
      <FinancialSummary />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <AccountsOverview />
        <BudgetGoalsList />
      </div>
      
      {isMobile ? (
        <div className="border border-black p-4 bg-white">
          <div className="pb-2">
            <h2 className="text-lg font-georama font-medium">Spending Trend</h2>
            <p className="text-sm text-muted-foreground">for the past month</p>
          </div>
          <div>
            <div className="w-full overflow-x-auto">
              <div className="min-w-[150vw] md:min-w-0">
                <EnhancedSpendingChart />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="font-georama">Spending Trend</CardTitle>
            <p className="text-sm text-muted-foreground">for the past month</p>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <div className="min-w-full md:min-w-0">
                <EnhancedSpendingChart />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 gap-3">
        <AIInsights />
      </div>
    </div>
  );
};

export default Dashboard;
