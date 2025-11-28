import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
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
      <Card className="rounded-3xl border border-border shadow-lg bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-georama">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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
      <Card className="rounded-3xl border border-border shadow-lg bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-georama">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
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

  if (accountTransactions.length === 0) {
    return (
      <Card className="rounded-3xl border border-border shadow-lg bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-georama">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No transactions found for this account.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-border shadow-lg bg-card hover:shadow-xl transition-shadow flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-georama">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between p-6 pt-0">
        <div className="space-y-3 mb-4">
          {accountTransactions.map((transaction, index) => (
            <div 
              key={`${transaction.account_id}-${transaction.created_at}-${index}`}
              className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm font-georama truncate">
                  {transaction.description}
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
        <Button 
          variant="outline" 
          className="w-full mt-auto"
          onClick={onSeeMore}
        >
          See More
          <ArrowDown className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
