
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountType } from "@/lib/data";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics, formatCurrency } from "@/lib/realData";
import { RecentTransactions } from "./RecentTransactions";
import { useLanguage } from "@/hooks/useLanguage";

interface AccountDetailProps {
  account: AccountType;
}

export const AccountDetail = ({ account }: AccountDetailProps) => {
  const { transactions } = useTransactions();
  const { accountBalances } = calculateFinancialMetrics(transactions);
  const { t } = useLanguage();
  
  const accountBalance = accountBalances[parseInt(account.id)] || 0;

  // Function to clean account names by removing redundant text
  const cleanAccountName = (name: string) => {
    return name
      .replace(/\s+Cheque$/i, '')
      .replace(/\s+Savings$/i, '')
      .replace(/\s+Credit$/i, '')
      .trim();
  };

  const cleanedAccountName = cleanAccountName(account.name);

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
                {cleanedAccountName.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{cleanedAccountName}</h2>
              <p className="text-muted-foreground capitalize">{account.type} {t('nav.accounts').slice(0, -1)}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('finance.currentBalance')}</p>
              <p className={`text-2xl font-bold ${accountBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(accountBalance)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('finance.accountType')}</p>
              <p className="text-lg font-semibold capitalize">{account.type}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('finance.currency')}</p>
              <p className="text-lg font-semibold">{account.currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <RecentTransactions accountId={account.id} />
    </div>
  );
};
