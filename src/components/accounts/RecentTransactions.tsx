
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency, formatDate } from "@/lib/realData";

interface RecentTransactionsProps {
  accountId: string;
}

export const RecentTransactions = ({ accountId }: RecentTransactionsProps) => {
  const { transactions, loading, error } = useTransactions();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center p-2 animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading transactions: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // Filter transactions for this specific account and get the latest 3
  const accountTransactions = transactions
    .filter(t => t.acc_no.toString() === accountId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  if (accountTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No transactions found for this account.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountTransactions.map((transaction, index) => (
              <TableRow key={`${transaction.acc_no}-${transaction.created_at}-${index}`}>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(transaction.created_at)}
                </TableCell>
                <TableCell className="font-medium">
                  {transaction.source}
                </TableCell>
                <TableCell className={`text-right font-medium ${
                  transaction.value < 0 ? 'text-destructive' : 'text-green-600'
                }`}>
                  {formatCurrency(transaction.value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
