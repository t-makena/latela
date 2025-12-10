
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/realData";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBudgetItems } from "@/hooks/useBudgetItems";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useAccounts } from "@/hooks/useAccounts";

interface FinancialSummaryProps {
  showExplanations?: boolean;
  minimal?: boolean;
}

export const FinancialSummary = ({ showExplanations = true, minimal = false }: FinancialSummaryProps) => {
  const { transactions, loading, error } = useTransactions();
  const { accounts, loading: accountsLoading } = useAccounts();
  const isMobile = useIsMobile();
  const { calculateTotalMonthly, loading: budgetLoading } = useBudgetItems();
  const currentDate = new Date();
  const { upcomingEvents, isLoading: eventsLoading } = useCalendarEvents({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1
  });

  console.log('FinancialSummary - transactions:', transactions);
  console.log('FinancialSummary - loading:', loading);
  console.log('FinancialSummary - error:', error);

  if (loading || budgetLoading || eventsLoading || accountsLoading) {
    if (minimal) {
      return (
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
          <div 
            className="bg-white rounded-full border border-black px-6 py-5 flex items-center"
            style={{ boxShadow: '4px 4px 0px #000000' }}
          >
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="w-px bg-gray-300 self-stretch mx-4" />
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      );
    }

    const content = (
      <>
        <div className={isMobile ? "pb-1" : "pb-2 pt-4"}>
          <div className={isMobile ? "text-base font-medium text-foreground font-georama" : "text-lg font-medium text-foreground font-georama"}>
            Financial Overview
          </div>
        </div>
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="financial-metric animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </>
    );

    return isMobile ? (
      <div className="animate-fade-in mb-4">{content}</div>
    ) : (
      <Card className="stat-card animate-fade-in">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-lg font-medium text-foreground font-georama">
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="financial-metric animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    if (minimal) {
      return (
        <div className="animate-fade-in">
          <h2 className="text-lg font-bold mb-4 font-georama text-black">Financial Overview</h2>
          <div 
            className="bg-white rounded-full border border-black px-6 py-5"
            style={{ boxShadow: '4px 4px 0px #000000' }}
          >
            <p className="text-destructive text-sm">Error loading data</p>
          </div>
        </div>
      );
    }

    return isMobile ? (
      <div className="animate-fade-in mb-4">
        <div className="pb-1">
          <div className="text-base font-medium text-foreground font-georama">
            Financial Overview
          </div>
        </div>
        <div>
          <p className="text-destructive">Error loading financial data: {error}</p>
        </div>
      </div>
    ) : (
      <Card className="stat-card animate-fade-in">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-lg font-medium text-foreground font-georama">
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading financial data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate available balance from sum of all account balances
  const availableBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  // Calculate budget balance (budget expenses + upcoming events)
  const totalBudgetExpenses = calculateTotalMonthly();
  const totalUpcomingEvents = upcomingEvents.reduce((sum, event) => sum + event.budgetedAmount, 0);
  const budgetBalance = totalBudgetExpenses + totalUpcomingEvents;

  // Calculate flexible balance (available balance - budget balance)
  const flexibleBalance = availableBalance - budgetBalance;

  // Determine budget status
  const budgetStatus = flexibleBalance >= 0 ? 'good' : 'bad';
  const budgetStatusDescription = budgetStatus === 'good' 
    ? "You're on track, keep going : )" 
    : "You're at risk of spending your savings : (";

  // Minimal view for mobile redesign - Neo-brutalist style
  if (minimal) {
    return (
      <div className="animate-fade-in">
        <h2 className="text-lg font-bold mb-4 font-georama text-black">Financial Overview</h2>
        <div 
          className="bg-white rounded-full border border-black px-6 py-[10px] flex items-center"
          style={{ boxShadow: '4px 4px 0px #000000' }}
        >
          <div className="flex-1">
            <p className="text-sm font-light text-[#999999] mb-1">Budget balance</p>
            <p className="text-lg font-light text-black">{formatCurrency(budgetBalance)}</p>
          </div>
          <div className="flex-1 text-right">
            <p className="text-sm font-light text-[#999999] mb-1">Flexible balance</p>
            <p className="text-lg font-light text-black">{formatCurrency(flexibleBalance)}</p>
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="financial-metric">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Available Balance
          </div>
          <div className={isMobile ? "text-xl font-bold mb-1" : "text-2xl font-bold mb-1"}>
            {formatCurrency(availableBalance)}
          </div>
          {showExplanations && (
            <p className="text-xs text-muted-foreground">
              Total balance across all accounts
            </p>
          )}
        </div>
        
        <div className="financial-metric">
          <div className="text-sm font-light text-muted-foreground mb-1">
            Budget Balance
          </div>
          <div className={isMobile ? "text-xl font-light mb-1" : "text-2xl font-light mb-1"}>
            {formatCurrency(budgetBalance)}
          </div>
          {showExplanations && (
            <p className="text-xs text-muted-foreground">
              Budget expenses plus upcoming events
            </p>
          )}
        </div>
        
        <div className="financial-metric">
          <div className="text-sm font-light text-muted-foreground mb-1">
            Flexible Balance
          </div>
          <div className={isMobile ? "text-xl font-light mb-1" : "text-2xl font-light mb-1"}>
            {formatCurrency(flexibleBalance)}
          </div>
          {showExplanations && (
            <p className="text-xs text-muted-foreground">
              Available balance less budget balance
            </p>
          )}
        </div>
        
        <div className="financial-metric">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Budget Status
          </div>
          <div className={isMobile ? "text-xl font-bold mb-1" : "text-2xl font-bold mb-1"}>
            {budgetStatus}
          </div>
          {showExplanations && (
            <p className="text-xs text-muted-foreground">
              {budgetStatusDescription}
            </p>
          )}
        </div>
      </div>
    </>
  );

  return isMobile ? (
    <div className="animate-fade-in mb-4">
      <div className="pb-1 mb-3">
        <div className="text-base font-medium text-foreground">
          Financial Overview
          {transactions.length === 0 && (
            <span className="text-xs text-orange-500 ml-2">(No transaction data found)</span>
          )}
        </div>
      </div>
      <div>{content}</div>
    </div>
  ) : (
    <Card className="stat-card animate-fade-in">
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="text-lg font-medium text-foreground">
          Financial Overview
          {transactions.length === 0 && (
            <span className="text-sm text-orange-500 ml-2">(No transaction data found)</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};
