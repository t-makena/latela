import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { AddBudgetItemDialog } from '@/components/budget/AddBudgetItemDialog';
import { useBudgetItems } from '@/hooks/useBudgetItems';
import { useGoals } from '@/hooks/useGoals';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useAccounts } from '@/hooks/useAccounts';
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

  const totalSavingGoals = goals.reduce((sum, goal) => sum + goal.amountSaved, 0);
  const totalBudgetExpenses = calculateTotalMonthly();
  const totalUpcomingEvents = upcomingEvents.reduce((sum, event) => sum + event.budgetedAmount, 0);

  const availableBalance = accounts.reduce((sum, account) => sum + (account.balance / 100), 0);
  const budgetBalance = availableBalance - totalSavingGoals - totalBudgetExpenses - totalUpcomingEvents;

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const isLoading = loading || goalsLoading || eventsLoading || accountsLoading;

  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Budget</h1>
        <p className="text-muted-foreground">Manage your monthly budget items</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Budget Items Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Budget Items</CardTitle>
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
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budgetItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            {item.frequency}
                            {item.frequency === 'Daily' && item.days_per_week && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({item.days_per_week}x/week)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(calculateMonthlyAmount(item))}
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
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(totalBudgetExpenses)}
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
          {/* Available Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle>Available Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Available Balance</span>
                    <span className="font-semibold">{formatCurrency(availableBalance)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Saving Goals</span>
                    <span className="font-semibold text-destructive">
                      -{formatCurrency(totalSavingGoals)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Budget Expenses</span>
                    <span className="font-semibold text-destructive">
                      -{formatCurrency(totalBudgetExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Upcoming Events</span>
                    <span className="font-semibold text-destructive">
                      -{formatCurrency(totalUpcomingEvents)}
                    </span>
                  </div>
                  <div className="pt-3 border-t flex justify-between items-center">
                    <span className="font-bold">Budget Balance</span>
                    <span className={`font-bold text-lg ${budgetBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {formatCurrency(budgetBalance)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Calculation Explanation Card */}
          <Card>
            <CardHeader>
              <CardTitle>Calculation Explanation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground mb-1">Monthly:</p>
                <p>Amount × 1</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Weekly:</p>
                <p>Amount × 4.33 (avg weeks/month)</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Bi-weekly:</p>
                <p>Amount × 2.17 (avg periods/month)</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Daily:</p>
                <p>Amount × Days/Week × 4.33</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Once-off:</p>
                <p>Full amount added to current month</p>
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
