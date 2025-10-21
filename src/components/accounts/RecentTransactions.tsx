
import { useState } from "react";
import { X, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency, formatDate } from "@/lib/realData";

interface RecentTransactionsProps {
  accountId: string;
}

export const RecentTransactions = ({ accountId }: RecentTransactionsProps) => {
  const { transactions, loading, error } = useTransactions();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  // Category labels mapping
  const categoryLabels: Record<string, string> = {
    "H&U": "Housing & Utilities",
    "S&I": "Savings & Investments",
    "P&L": "Personal & Lifestyle",
    "F&G": "Food & Groceries",
    "T/F": "Transportation & Fuel",
    "D&R": "Dining & Restaurants",
    "S&R": "Shopping & Retail",
    "E&R": "Entertainment & Recreation",
    "H&M": "Healthcare & Medical",
    "B&S": "Bills & Subscriptions",
    "Misc": "Miscellaneous"
  };

  const getCategoryFromDescription = (description: string): string => {
    const desc = description.toLowerCase();
    if (desc.includes('rent') || desc.includes('utilities') || desc.includes('electricity')) return 'H&U';
    if (desc.includes('grocery') || desc.includes('food') || desc.includes('supermarket')) return 'F&G';
    if (desc.includes('fuel') || desc.includes('transport') || desc.includes('uber')) return 'T/F';
    if (desc.includes('restaurant') || desc.includes('dining') || desc.includes('cafe')) return 'D&R';
    if (desc.includes('shopping') || desc.includes('store') || desc.includes('retail')) return 'S&R';
    if (desc.includes('movie') || desc.includes('entertainment') || desc.includes('game')) return 'E&R';
    if (desc.includes('doctor') || desc.includes('medical') || desc.includes('pharmacy')) return 'H&M';
    if (desc.includes('subscription') || desc.includes('bill') || desc.includes('insurance')) return 'B&S';
    if (desc.includes('savings') || desc.includes('investment')) return 'S&I';
    return 'Misc';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-georama">Recent Transactions</CardTitle>
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
          <CardTitle className="font-georama">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading transactions: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // Filter transactions for this specific account and apply category filter
  let accountTransactions = transactions
    .filter(t => t.account_id === accountId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Apply category filter if selected
  if (selectedCategory) {
    accountTransactions = accountTransactions.filter(t => 
      getCategoryFromDescription(t.description) === selectedCategory
    );
  } else {
    // Only show latest 3 if no filter is applied
    accountTransactions = accountTransactions.slice(0, 3);
  }

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleClearFilter = () => {
    setSelectedCategory(null);
  };

  const handleNavigateToInsights = () => {
    // Pass the full category name instead of the code
    if (selectedCategory) {
      const categoryName = categoryLabels[selectedCategory];
      navigate('/financial-insight', { state: { categoryFilterName: categoryName } });
    }
  };

  if (accountTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="font-georama">Recent Transactions</CardTitle>
              {selectedCategory && (
                <div className="flex items-center gap-1">
                  <Badge 
                    variant="secondary" 
                    className="flex items-center gap-1 cursor-default"
                  >
                    {categoryLabels[selectedCategory]}
                    <button
                      onClick={handleClearFilter}
                      className="ml-1 hover:bg-background/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {selectedCategory 
              ? `No ${categoryLabels[selectedCategory]} transactions found for this account.` 
              : "No transactions found for this account."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="font-georama">Recent Transactions</CardTitle>
            {selectedCategory && (
              <div className="flex items-center gap-1">
                <Badge 
                  variant="secondary" 
                  className="flex items-center gap-1 cursor-default"
                >
                  {categoryLabels[selectedCategory]}
                  <button
                    onClick={handleClearFilter}
                    className="ml-1 hover:bg-background/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleNavigateToInsights}
                  title="View in Financial Insights"
                >
                  <TrendingUp className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-georama">Date</TableHead>
              <TableHead className="font-georama">Description</TableHead>
              <TableHead className="font-georama">Category</TableHead>
              <TableHead className="text-right font-georama">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountTransactions.map((transaction, index) => {
              const category = getCategoryFromDescription(transaction.description);
              return (
                <TableRow key={`${transaction.account_id}-${transaction.created_at}-${index}`}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(transaction.created_at)}
                  </TableCell>
                  <TableCell className="font-medium font-georama">
                    {transaction.description}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleCategoryClick(category)}
                    >
                      {categoryLabels[category]}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium font-georama ${
                    transaction.amount < 0 ? 'text-destructive' : 'text-green-600'
                  }`}>
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
