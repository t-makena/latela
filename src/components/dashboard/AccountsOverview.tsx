
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics, formatCurrency } from "@/lib/realData";
import { useIsMobile } from "@/hooks/use-mobile";

export const AccountsOverview = () => {
  const { accounts, loading: accountsLoading, error: accountsError } = useAccounts();
  const { transactions } = useTransactions();
  const { accountBalances } = calculateFinancialMetrics(transactions);
  const isMobile = useIsMobile();

  // Function to clean account names by removing redundant text
  const cleanAccountName = (name: string) => {
    return name
      .replace(/\s+Cheque$/i, '')
      .replace(/\s+Savings$/i, '')
      .replace(/\s+Credit$/i, '')
      .trim();
  };

  if (accountsLoading) {
    const content = (
      <>
        <div className="pb-2">
          <div className={isMobile ? "text-base font-georama font-medium" : "text-lg font-georama font-medium"}>Accounts</div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </>
    );

    return isMobile ? (
      <div className="mb-4">{content}</div>
    ) : (
      <Card className="stat-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-georama font-medium">Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (accountsError) {
    return isMobile ? (
      <div className="mb-4">
        <div className="pb-2">
          <div className="text-base font-georama font-medium">Accounts</div>
        </div>
        <div>
          <p className="text-destructive">Error loading accounts: {accountsError}</p>
        </div>
      </div>
    ) : (
      <Card className="stat-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-georama font-medium">Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading accounts: {accountsError}</p>
        </CardContent>
      </Card>
    );
  }

  const accountsList = (
    <div className="space-y-3">
      {accounts.map((account) => {
        const balance = accountBalances[parseInt(account.id)] || 0;
        const cleanedName = cleanAccountName(account.name);
        
        return (
          <div key={account.id} className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div 
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: account.color }}
              >
                <span className="text-white text-sm font-medium">
                  {cleanedName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium font-georama">{cleanedName}</p>
                <p className="text-sm text-muted-foreground capitalize">{account.type}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold font-georama ${balance < 0 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(balance)}
              </p>
              <p className="text-xs text-muted-foreground">{account.currency}</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  return isMobile ? (
    <div className="mb-4">
      <div className="pb-2 mb-3">
        <div className="text-base font-georama font-medium">Accounts</div>
      </div>
      {accountsList}
    </div>
  ) : (
    <Card className="stat-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-georama font-medium">Accounts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {accountsList}
      </CardContent>
    </Card>
  );
};
