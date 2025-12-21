import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency, formatDate } from "@/lib/realData";

interface CompactRecentTransactionsProps {
  accountId: string;
  onSeeMore: () => void;
}

export const CompactRecentTransactions = ({ accountId, onSeeMore }: CompactRecentTransactionsProps) => {
  const { transactions, loading, error } = useTransactions();

  if (loading) {
    return (
      <Card className="rounded-3xl border border-black bg-card" style={{ boxShadow: '4px 4px 0px #000000' }}>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-georama">Recent Transactions</CardTitle>
          <Button variant="ghost" className="text-sm h-auto p-0" disabled>
            See More
          </Button>
        </CardHeader>
        <CardContent className="space-y-1.5 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center animate-pulse">
              <div className="flex-1">
                <div className="h-3 bg-muted rounded mb-1 w-3/4"></div>
                <div className="h-2 bg-muted rounded w-1/2"></div>
              </div>
              <div className="h-3 bg-muted rounded w-16"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-3xl border border-black bg-card" style={{ boxShadow: '4px 4px 0px #000000' }}>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-georama">Recent Transactions</CardTitle>
          <Button variant="ghost" className="text-sm h-auto p-0" disabled>
            See More
          </Button>
        </CardHeader>
        <CardContent className="py-4">
          <p className="text-sm text-destructive">Error loading transactions</p>
        </CardContent>
      </Card>
    );
  }

  // Filter transactions for this specific account and get latest 3
  const accountTransactions = transactions
    .filter(t => t.account_id === accountId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  // Helper to get display name for transaction
  const getDisplayMerchantName = (transaction: typeof transactions[0]) => {
    // Use display_merchant_name if available, otherwise fallback to description
    return (transaction as any).display_merchant_name || transaction.description;
  };

  if (accountTransactions.length === 0) {
    return (
      <Card className="rounded-3xl border border-black bg-card" style={{ boxShadow: '4px 4px 0px #000000' }}>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-georama">Recent Transactions</CardTitle>
          <Button variant="ghost" className="text-sm h-auto p-0" disabled>
            See More
          </Button>
        </CardHeader>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">No transactions found for this account.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-black bg-card" style={{ boxShadow: '4px 4px 0px #000000' }}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-georama">Recent Transactions</CardTitle>
        <Button 
          variant="ghost" 
          className="text-sm h-auto p-0 hover:underline"
          onClick={onSeeMore}
        >
          See More
        </Button>
      </CardHeader>
      <CardContent className="py-4">
        <div className="space-y-2">
          {accountTransactions.map((transaction, index) => (
            <div 
              key={`${transaction.account_id}-${transaction.created_at}-${index}`}
              className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm font-georama truncate">
                  {getDisplayMerchantName(transaction)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatDate(transaction.created_at)}
                </p>
              </div>
              <span className={`font-semibold text-sm font-georama ml-3 flex-shrink-0 ${
                transaction.amount < 0 ? 'text-destructive' : 'text-green-600'
              }`}>
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
