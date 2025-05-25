
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { AccountsOverview } from "@/components/dashboard/AccountsOverview";
import { EnhancedSpendingChart } from "@/components/dashboard/EnhancedSpendingChart";
import { SavingsBalanceChart } from "@/components/dashboard/SavingsBalanceChart";
import { BudgetGoalsList } from "@/components/dashboard/BudgetGoalsList";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { accounts, formatCurrency } from "@/lib/data";
import { CreditCard } from "lucide-react";

const Index = () => {
  const mainChecking = accounts.find(account => account.name === "Main Checking");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your financial status.
        </p>
      </div>

      <FinancialSummary />

      {/* Combined Main Checking and Weekly Spending Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Main Checking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mainChecking ? (
              <div className="space-y-2">
                <div className="text-3xl font-bold">
                  {formatCurrency(mainChecking.balance)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Current balance
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <div 
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: mainChecking.color }}
                  />
                  <span className="text-sm capitalize">
                    {mainChecking.type} account
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Account not found</p>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <EnhancedSpendingChart />
        </div>
      </div>

      {/* Combined Savings Balance Trend */}
      <SavingsBalanceChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetGoalsList />
        <AIInsights />
      </div>

      <AccountsOverview />
    </div>
  );
};

export default Index;
