import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBudgetItems } from '@/hooks/useBudgetItems';
import { useGoals } from '@/hooks/useGoals';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useAccounts } from '@/hooks/useAccounts';
import { Skeleton } from '@/components/ui/skeleton';

export const AvailableBalanceCard = () => {
  const currentDate = new Date();
  const { calculateTotalMonthly, loading: budgetLoading } = useBudgetItems();
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

  const isLoading = budgetLoading || goalsLoading || eventsLoading || accountsLoading;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pt-4 pb-4">
        <CardTitle className="text-lg">Available Balance</CardTitle>
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
  );
};
