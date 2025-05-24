
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
    <>
      <Card className="mt-6">
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
            <div className={`text-2xl font-bold ${account.balance < 0 ? 'text-destructive' : ''}`}>
              {formatCurrency(account.balance, account.currency)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold mb-3">Recent Transactions</h3>
          
          {accountTransactions.length > 0 ? (
            <div className="space-y-3">
              {accountTransactions.map(transaction => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-muted/50 transition-colors"
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
          
          <div className="mt-6 flex justify-end">
            <Button variant="outline" className="mr-2">Edit Account</Button>
            <Button>Add Transaction</Button>
          </div>

          {account.type === 'checking' && (
            <div className="mt-6">
              <EnhancedSpendingChart accountSpecific={true} accountId={account.id} />
            </div>
          )}
        </CardContent>
      </Card>

      {account.type === 'savings' && (
        <SavingsBalanceChart />
      )}
    </>
  );
};
