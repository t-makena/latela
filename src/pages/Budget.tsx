import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { AddBudgetItemDialog } from '@/components/budget/AddBudgetItemDialog';
import { useBudgetItems } from '@/hooks/useBudgetItems';
import { useGoals } from '@/hooks/useGoals';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useSubcategories } from '@/hooks/useSubcategories';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';

const Budget = () => {
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const currentDate = new Date();
  const { budgetItems, loading, calculateMonthlyAmount, calculateTotalMonthly, addBudgetItem, deleteBudgetItem } = useBudgetItems();
  const { goals, loading: goalsLoading } = useGoals();
  const { upcomingEvents, isLoading: eventsLoading } = useCalendarEvents({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1
  });
  const { accounts, loading: accountsLoading } = useAccounts();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { subcategories, loading: categoriesLoading } = useSubcategories();

  // Function to get display name (custom name if category has been replaced)
  const getDisplayName = (itemName: string) => {
    // Find a custom category that replaced a system category with this name
    const replacedCategory = subcategories.find(
      (sub) => sub.is_custom && sub.original_name === itemName
    );
    
    if (replacedCategory) {
      return replacedCategory.name;
    }
    
    return itemName;
  };

  const totalSavingGoals = goals.reduce((sum, goal) => sum + goal.amountSaved, 0);
  const totalBudgetExpenses = calculateTotalMonthly();
  const totalUpcomingEvents = upcomingEvents.reduce((sum, event) => sum + event.budgetedAmount, 0);

  const availableBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const budgetBalanceValue = totalBudgetExpenses + totalUpcomingEvents;
  const flexibleBalance = availableBalance - totalSavingGoals - budgetBalanceValue;

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  // Calculate amount spent for each budget item by matching category or description
  const calculateAmountSpent = useMemo(() => {
    if (transactionsLoading || !transactions) return {};

    const spentByItem: Record<string, number> = {};

    budgetItems.forEach((item) => {
      const itemNameLower = item.name.toLowerCase();
      
      const matchingTransactions = transactions.filter((t) => {
        // Match by parent category name
        if (t.parent_category_name?.toLowerCase() === itemNameLower) return true;
        // Match by subcategory name
        if (t.subcategory_name?.toLowerCase() === itemNameLower) return true;
        // Match by display subcategory name (custom categories)
        if (t.display_subcategory_name?.toLowerCase() === itemNameLower) return true;
        // Match by merchant name
        if (t.merchant_name?.toLowerCase().includes(itemNameLower)) return true;
        // Fallback: match by description
        if (t.description?.toLowerCase().includes(itemNameLower)) return true;
        return false;
      });
      
      const totalSpent = matchingTransactions.reduce((sum, t) => {
        // Only count expenses (negative amounts or DR transaction code)
        if (t.amount < 0 || t.transaction_code === 'DR') {
          return sum + Math.abs(t.amount);
        }
        return sum;
      }, 0);
      
      spentByItem[item.id] = totalSpent;
    });

    return spentByItem;
  }, [budgetItems, transactions, transactionsLoading]);

  const totalAmountSpent = useMemo(() => {
    return Object.values(calculateAmountSpent).reduce((sum, amount) => sum + amount, 0);
  }, [calculateAmountSpent]);

  const isLoading = loading || goalsLoading || eventsLoading || accountsLoading;

  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Budget Items Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Budget Plan</CardTitle>
              <Button
                size="icon"
                onClick={() => setDialogOpen(true)}
                className="rounded-full"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : budgetItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No budget items yet</p>
                  <p className="text-sm mt-2">Click the + button to add your first budget item</p>
                </div>
              ) : (
                <div className={isMobile ? "overflow-x-auto" : ""}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category/Merchant</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead className="text-right">Freq x Budget</TableHead>
                        <TableHead className="text-right">Amount Spent</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budgetItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{getDisplayName(item.name)}</TableCell>
                          <TableCell>
                            {item.frequency}
                            {item.frequency === 'Daily' && item.days_per_week && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({item.days_per_week}x/week)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(calculateMonthlyAmount(item))}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={
                              (calculateAmountSpent[item.id] || 0) > calculateMonthlyAmount(item)
                                ? 'text-destructive font-semibold'
                                : 'text-green-600 dark:text-green-500'
                            }>
                              {formatCurrency(calculateAmountSpent[item.id] || 0)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteBudgetItem(item.id)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell colSpan={3}>Total</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(totalBudgetExpenses)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(totalAmountSpent)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Cards */}
        <div className="space-y-6">
          {/* Balance Calculations Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Balance calculations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </>
              ) : (
                <>
                  {/* Budget Balance Calculation Section */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Planned expenses</span>
                    <span className="font-normal">{formatCurrency(totalBudgetExpenses)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Upcoming events</span>
                    <span className="font-normal">{formatCurrency(totalUpcomingEvents)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold">Budget Balance</span>
                    <span className="font-bold">{formatCurrency(budgetBalanceValue)}</span>
                  </div>

                  {/* Flexible Balance Calculation Section */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-sm">Available Balance</span>
                    <span className="font-normal">{formatCurrency(availableBalance)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Savings Goals</span>
                    <span className="font-normal">-{formatCurrency(totalSavingGoals)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Budget Balance</span>
                    <span className="font-normal">-{formatCurrency(budgetBalanceValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Flexible Balance</span>
                    <span className="font-bold">{flexibleBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(flexibleBalance))}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Calculation Explanation Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Calculation Explanation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground mb-1">Monthly:</p>
                <p>Amount × 1</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Weekly:</p>
                <p>Amount × 4</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Bi-weekly:</p>
                <p>Amount × 2</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Daily:</p>
                <p>Amount × 4</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Once-off:</p>
                <p>Amount × 1</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddBudgetItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={addBudgetItem}
      />
    </div>
  );
};

export default Budget;
