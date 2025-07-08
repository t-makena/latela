
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
    return (
      <div className={isMobile ? "border border-black p-4 bg-white" : "stat-card"}>
        <div className="pb-2">
          <h2 className="text-lg font-georama font-medium">Accounts</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (accountsError) {
    return (
      <div className={isMobile ? "border border-black p-4 bg-white" : "stat-card"}>
        <div className="pb-2">
          <h2 className="text-lg font-georama font-medium">Accounts</h2>
        </div>
        <div>
          <p className="text-destructive">Error loading accounts: {accountsError}</p>
        </div>
      </div>
    );
  }

  const Container = isMobile ? 'div' : Card;
  const Header = isMobile ? 'div' : CardHeader;
  const Content = isMobile ? 'div' : CardContent;

  return (
    <Container className={isMobile ? "border border-black p-4 bg-white" : "stat-card"}>
      <Header className="pb-2">
        <h2 className="text-lg font-georama font-medium">Accounts</h2>
      </Header>
      <Content className="space-y-3">
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
      </Content>
    </Container>
  );
};
