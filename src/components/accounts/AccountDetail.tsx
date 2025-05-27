
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccountType, formatCurrency, transactions, formatDate } from "@/lib/data";
import { EnhancedSpendingChart } from "@/components/dashboard/EnhancedSpendingChart";
import { SavingsBalanceChart } from "@/components/dashboard/SavingsBalanceChart";

interface AccountDetailProps {
  account: AccountType;
}

export const AccountDetail = ({ account }: AccountDetailProps) => {
  const accountTransactions = transactions.filter(t => t.accountId === account.id);

  return (
    <Card className="mt-6 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: account.color }}
            >
              <span className="text-white font-medium">
                {account.name.charAt(0)}
              </span>
            </div>
            <div>
              <CardTitle>{account.name}</CardTitle>
              <Badge variant="outline" className="mt-1 capitalize">
                {account.type}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-2xl font-bold ${account.balance < 0 ? 'text-destructive' : ''}`}>
              {formatCurrency(account.balance, account.currency)}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Edit Account</Button>
              <Button size="sm">Add Transaction</Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Recent Transactions Section */}
        <div>
          <h3 className="font-semibold mb-4 text-lg">Recent Transactions</h3>
          
          {accountTransactions.length > 0 ? (
            <div className="space-y-3">
              {accountTransactions.map(transaction => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline" className="capitalize">
                        {transaction.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(transaction.date)}
                      </span>
                    </div>
                  </div>
                  <div className={`font-bold ${transaction.type === 'expense' ? 'text-destructive' : 'text-budget-income'}`}>
                    {transaction.type === 'expense' ? '-' : '+'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">
              No transactions found for this account.
            </p>
          )}
        </div>

        {/* Analytics Section */}
        {account.type === 'checking' && (
          <div className="border-t pt-8">
            <h3 className="font-semibold mb-4 text-lg">Spending Analytics</h3>
            <div className="mt-4">
              <div className="pb-2">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h4 className="text-lg font-semibold">Daily Spending Trend</h4>
                  <div className="flex gap-1">
                    <Button variant="default" size="sm">1W</Button>
                    <Button variant="outline" size="sm">1M</Button>
                    <Button variant="outline" size="sm">6M</Button>
                    <Button variant="outline" size="sm">1Y</Button>
                    <Button variant="outline" size="sm">1W></Button>
                  </div>
                </div>
              </div>
              <EnhancedSpendingChart accountSpecific={true} accountId={account.id} />
            </div>
          </div>
        )}

        {/* Savings Balance Chart Section */}
        {account.type === 'savings' && (
          <div className="border-t pt-8">
            <h3 className="font-semibold mb-4 text-lg">Savings Balance Trend</h3>
            <div className="mt-4">
              <div className="pb-2">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h4 className="text-lg font-semibold">Savings Balance Trend</h4>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm">1W</Button>
                    <Button variant="outline" size="sm">1M</Button>
                    <Button variant="default" size="sm">6M</Button>
                    <Button variant="outline" size="sm">1Y</Button>
                  </div>
                </div>
              </div>
              <SavingsBalanceChart />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
