
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { AccountsOverview } from "@/components/dashboard/AccountsOverview";
import { BudgetGoalsList } from "@/components/dashboard/BudgetGoalsList";
import { EnhancedSpendingChart } from "@/components/dashboard/EnhancedSpendingChart";
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
        
        <Card className="mt-2">
          <CardHeader className={isMobile ? "pb-2" : ""}>
            <CardTitle className={isMobile ? "text-lg font-georama" : "font-georama"}>Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedSpendingChart />
          </CardContent>
        </Card>
    </div>
  );
};

export default Dashboard;
