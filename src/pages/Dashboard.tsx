
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { AccountsOverview } from "@/components/dashboard/AccountsOverview";
import { BudgetGoalsList } from "@/components/dashboard/BudgetGoalsList";
import { EnhancedSpendingChart } from "@/components/dashboard/EnhancedSpendingChart";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import piggyBankDoodle from "@/assets/piggy-bank-doodle.png";
import budgetChartDoodle from "@/assets/budget-chart-doodle.png";
import happyMoneyDoodle from "@/assets/happy-money-doodle.png";

const Dashboard = () => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-2 relative">      
      {/* Fun doodles positioned absolutely */}
      <img 
        src={piggyBankDoodle} 
        alt="" 
        className="absolute top-4 right-4 w-12 h-12 opacity-20 pointer-events-none z-0 hidden lg:block" 
      />
      <img 
        src={budgetChartDoodle} 
        alt="" 
        className="absolute top-80 left-4 w-10 h-10 opacity-15 pointer-events-none z-0 hidden lg:block" 
      />
      <img 
        src={happyMoneyDoodle} 
        alt="" 
        className="absolute bottom-20 right-8 w-14 h-14 opacity-25 pointer-events-none z-0 hidden lg:block" 
      />
      
      <div className="relative z-10">
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
    </div>
  );
};

export default Dashboard;
