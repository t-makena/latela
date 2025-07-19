
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
    <div className="space-y-2 relative z-10">
        <FinancialSummary />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-2">
          <AccountsOverview />
          <BudgetGoalsList />
        </div>
        
        {isMobile ? (
          <Card className="mt-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-georama">Spending Trend</CardTitle>
              <p className="text-sm text-muted-foreground">for the past month</p>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <div className="min-w-[200vw] md:min-w-0">
                  <EnhancedSpendingChart />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-2">
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
        
        <div className="grid grid-cols-1 gap-2 mt-2">
          <AIInsights />
        </div>
    </div>
  );
};

export default Dashboard;
