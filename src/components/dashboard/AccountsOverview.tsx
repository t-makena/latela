
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics, formatCurrency } from "@/lib/realData";

export const AccountsOverview = () => {
  const { accounts, loading: accountsLoading, error: accountsError } = useAccounts();
  const { transactions, loading: transactionsLoading } = useTransactions();

  const loading = accountsLoading || transactionsLoading;
  
  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-2 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                  <div>
                    <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (accountsError) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading accounts: {accountsError}</p>
        </CardContent>
      </Card>
    );
  }

  const { accountBalances } = calculateFinancialMetrics(transactions);

  // Update accounts with real balances
  const accountsWithBalances = accounts.map(account => ({
    ...account,
    balance: accountBalances[parseInt(account.id)] || 0
  }));

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Accounts</CardTitle>
          <Link to="/accounts">
            <Button variant="ghost" size="sm" className="gap-1">
              See all <ChevronRight size={16} />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {accountsWithBalances.map((account) => (
            <div key={account.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors">
              <div className="flex items-center gap-3">
                <div 
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: account.color }}
                >
                  <span className="text-white font-medium text-sm">
                    {account.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {account.type}
                  </p>
                </div>
              </div>
              <div className={`font-bold ${account.balance < 0 ? 'text-destructive' : ''}`}>
                {formatCurrency(account.balance)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
