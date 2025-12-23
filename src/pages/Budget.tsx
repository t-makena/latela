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
import { useLanguage } from '@/hooks/useLanguage';

const Budget = () => {
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const currentDate = new Date();
  const { t } = useLanguage();
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

  // Mobile layout - separate path without container wrapper
  if (isMobile) {
    return (
      <div className="min-h-screen bg-white py-6 space-y-5 animate-fade-in">
        {/* Budget Plan Card */}
        <div 
          className="bg-card rounded-3xl border border-foreground p-5 w-full"
          style={{ boxShadow: '4px 4px 0px #000000' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-main">{t('finance.budgetPlan')}</h2>
            <Button
              size="icon"
              onClick={() => setDialogOpen(true)}
              className="rounded-full h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : budgetItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No budget items yet</p>
              <p className="text-sm mt-2">Tap + to add your first item</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 table-header-text">{t('finance.category')}:</th>
                  <th className="text-right py-2 table-header-text">{t('finance.amountSpent')}:</th>
                </tr>
              </thead>
              <tbody>
                {budgetItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-3 table-body-text font-medium">{getDisplayName(item.name)}</td>
                    <td className="py-3 table-body-text text-right">
                      <span className={`currency ${
                        (calculateAmountSpent[item.id] || 0) > calculateMonthlyAmount(item)
                          ? 'text-negative font-semibold'
                          : 'text-positive'
                      }`}>
                        {formatCurrency(calculateAmountSpent[item.id] || 0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Balance Calculations Card */}
        <div 
          className="bg-card rounded-3xl border border-foreground p-5 w-full"
          style={{ boxShadow: '4px 4px 0px #000000' }}
        >
          <h2 className="heading-main mb-4">{t('budget.balanceCalculations')}</h2>
          
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3 table-body-text">
              <div className="flex justify-between items-center">
                <span className="label-text">{t('budget.plannedExpenses')}</span>
                <span className="currency">{formatCurrency(totalBudgetExpenses)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="label-text">{t('budget.upcomingEvents')}</span>
                <span className="currency">{formatCurrency(totalUpcomingEvents)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="font-bold">{t('finance.budgetBalance')}</span>
                <span className="font-bold currency">{formatCurrency(budgetBalanceValue)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="label-text">{t('finance.availableBalance')}</span>
                <span className="currency">{formatCurrency(availableBalance)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="label-text">{t('budget.savingsGoals')}</span>
                <span className="currency">-{formatCurrency(totalSavingGoals)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="label-text">{t('finance.budgetBalance')}</span>
                <span className="currency">-{formatCurrency(budgetBalanceValue)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-bold">{t('finance.flexibleBalance')}</span>
                <span className="font-bold currency">{flexibleBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(flexibleBalance))}</span>
              </div>
            </div>
          )}
        </div>

        <AddBudgetItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onAdd={addBudgetItem}
        />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Budget Items Table */}
        <div className="lg:col-span-2 w-full">
          <Card className="w-full bg-card border border-foreground" style={{ boxShadow: '4px 4px 0px #000000' }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="heading-main">{t('finance.budgetPlan')}</CardTitle>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="table-header-text">Category/Merchant</TableHead>
                      <TableHead className="table-header-text">Frequency</TableHead>
                      <TableHead className="text-right table-header-text">Budget</TableHead>
                      <TableHead className="text-right table-header-text">Freq x Budget</TableHead>
                      <TableHead className="text-right table-header-text">Amount Spent</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="table-body-text font-medium">{getDisplayName(item.name)}</TableCell>
                        <TableCell className="table-body-text">
                          {item.frequency}
                          {item.frequency === 'Daily' && item.days_per_week && (
                            <span className="text-transaction-date text-text-muted ml-1">
                              ({item.days_per_week}x/week)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right table-body-text currency">
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell className="text-right table-body-text currency">
                          {formatCurrency(calculateMonthlyAmount(item))}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`table-body-text currency ${
                            (calculateAmountSpent[item.id] || 0) > calculateMonthlyAmount(item)
                              ? 'text-negative font-semibold'
                              : 'text-positive'
                          }`}>
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
                      <TableCell colSpan={3} className="table-body-text font-bold">Total</TableCell>
                      <TableCell className="text-right table-body-text font-bold currency">
                        {formatCurrency(totalBudgetExpenses)}
                      </TableCell>
                      <TableCell className="text-right table-body-text font-bold currency">
                        {formatCurrency(totalAmountSpent)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Cards */}
        <div className="space-y-6 w-full">
          {/* Balance Calculations Card */}
          <Card className="w-full bg-card border border-foreground" style={{ boxShadow: '4px 4px 0px #000000' }}>
            <CardHeader>
              <CardTitle className="heading-main">{t('budget.balanceCalculations')}</CardTitle>
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
                    <span className="label-text">Planned expenses</span>
                    <span className="table-body-text currency">{formatCurrency(totalBudgetExpenses)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="label-text">Upcoming events</span>
                    <span className="table-body-text currency">{formatCurrency(totalUpcomingEvents)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="table-body-text font-bold">Budget Balance</span>
                    <span className="table-body-text font-bold currency">{formatCurrency(budgetBalanceValue)}</span>
                  </div>

                  {/* Flexible Balance Calculation Section */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="label-text">Available Balance</span>
                    <span className="table-body-text currency">{formatCurrency(availableBalance)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="label-text">Savings Goals</span>
                    <span className="table-body-text currency">-{formatCurrency(totalSavingGoals)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="label-text">Budget Balance</span>
                    <span className="table-body-text currency">-{formatCurrency(budgetBalanceValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="table-body-text font-bold">Flexible Balance</span>
                    <span className="table-body-text font-bold currency">{flexibleBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(flexibleBalance))}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Calculation Explanation Card */}
          <Card className="w-full bg-card border border-foreground" style={{ boxShadow: '4px 4px 0px #000000' }}>
            <CardHeader>
              <CardTitle className="heading-card">Calculation Explanation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><span className="font-semibold text-foreground">Monthly:</span> Amount × 1</p>
              <p><span className="font-semibold text-foreground">Weekly:</span> Amount × 4</p>
              <p><span className="font-semibold text-foreground">Bi-weekly:</span> Amount × 2</p>
              <p><span className="font-semibold text-foreground">Daily:</span> Amount × 4</p>
              <p><span className="font-semibold text-foreground">Once-off:</span> Amount × 1</p>
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
