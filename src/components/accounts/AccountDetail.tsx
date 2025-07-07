
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountType } from "@/lib/data";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics, formatCurrency } from "@/lib/realData";
import { RecentTransactions } from "./RecentTransactions";

interface AccountDetailProps {
  account: AccountType;
}

export const AccountDetail = ({ account }: AccountDetailProps) => {
  const { transactions } = useTransactions();
  const { accountBalances } = calculateFinancialMetrics(transactions);
  
  const accountBalance = accountBalances[parseInt(account.id)] || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: account.color }}
            >
              <span className="text-white font-medium">
                {account.name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{account.name}</h2>
              <p className="text-muted-foreground capitalize">{account.type} Account</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className={`text-2xl font-bold ${accountBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(accountBalance)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Account Type</p>
              <p className="text-lg font-semibold capitalize">{account.type}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="text-lg font-semibold">{account.currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <RecentTransactions accountId={account.id} />
    </div>
  );
};
