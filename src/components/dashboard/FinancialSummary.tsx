
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/realData";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBudgetItems } from "@/hooks/useBudgetItems";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useAccounts } from "@/hooks/useAccounts";
import { useLanguage } from "@/hooks/useLanguage";

interface FinancialSummaryProps {
  showExplanations?: boolean;
  minimal?: boolean;
}

export const FinancialSummary = ({ showExplanations = true, minimal = false }: FinancialSummaryProps) => {
  const { transactions, loading, error } = useTransactions();
  const { accounts, loading: accountsLoading } = useAccounts();
  const isMobile = useIsMobile();
  const { calculateTotalMonthly, loading: budgetLoading } = useBudgetItems();
  const { t } = useLanguage();
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
        <div className="heading-main">
          {t('finance.financialOverview')}
        </div>
        </div>
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="financial-metric animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded mb-1"></div>
                <div className="h-3 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </>
    );

    return isMobile ? (
      <div className="animate-fade-in mb-4">{content}</div>
    ) : (
      <Card className="animate-fade-in" style={{ boxShadow: '4px 4px 0px #000000' }}>
        <CardHeader className="pb-2 pt-4">
        <CardTitle className="heading-main">
          {t('finance.financialOverview')}
        </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="financial-metric animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded mb-1"></div>
                <div className="h-3 bg-muted rounded"></div>
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
          <h2 className="heading-main mb-4">{t('finance.financialOverview')}</h2>
          <div 
            className="bg-card rounded-full border border-foreground px-6 py-5"
            style={{ boxShadow: '4px 4px 0px #000000' }}
          >
            <p className="text-destructive text-sm">{t('common.error')}</p>
          </div>
        </div>
      );
    }

    return isMobile ? (
      <div className="animate-fade-in mb-4">
        <div className="pb-1">
          <div className="heading-main">
            {t('finance.financialOverview')}
          </div>
        </div>
        <div>
          <p className="text-destructive">{t('common.error')}: {error}</p>
        </div>
      </div>
    ) : (
      <Card className="animate-fade-in" style={{ boxShadow: '4px 4px 0px #000000' }}>
        <CardHeader className="pb-2 pt-4">
        <CardTitle className="heading-main">
          {t('finance.financialOverview')}
        </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{t('common.error')}: {error}</p>
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
    ? t('finance.onTrack')
    : t('finance.atRisk');

  // Minimal view for mobile redesign - Neo-brutalist style
  if (minimal) {
    return (
      <div className="animate-fade-in w-full">
        <div 
          className="bg-card rounded-3xl border border-foreground p-5 w-full"
          style={{ boxShadow: '4px 4px 0px #000000' }}
        >
          <h2 className="heading-card mb-4">{t('finance.financialOverview')}</h2>
          <div className="flex items-center">
            <div className="flex-1">
              <p className="label-text mb-1">{t('finance.budgetBalance')}</p>
              <p className="text-balance-secondary font-bold currency">{formatCurrency(budgetBalance)}</p>
            </div>
            <div className="flex-1 text-right">
              <p className="label-text mb-1">{t('finance.flexibleBalance')}</p>
              <p className="text-balance-secondary font-bold currency">{formatCurrency(flexibleBalance)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="financial-metric">
          <div className="label-text mb-1">
            {t('finance.availableBalance')}
          </div>
          <div className="text-balance-secondary font-bold mb-1 currency">
            {formatCurrency(availableBalance)}
          </div>
          {showExplanations && (
            <p className="text-transaction-date text-text-faint">
              {t('finance.totalBalanceAllAccounts')}
            </p>
          )}
        </div>
        
        <div className="financial-metric">
          <div className="label-text mb-1">
            {t('finance.budgetBalance')}
          </div>
          <div className="text-balance-secondary font-bold mb-1 currency">
            {formatCurrency(budgetBalance)}
          </div>
          {showExplanations && (
            <p className="text-transaction-date text-text-faint">
              {t('finance.budgetExpensesPlusEvents')}
            </p>
          )}
        </div>
        
        <div className="financial-metric">
          <div className="label-text mb-1">
            {t('finance.flexibleBalance')}
          </div>
          <div className="text-balance-secondary font-bold mb-1 currency">
            {formatCurrency(flexibleBalance)}
          </div>
          {showExplanations && (
            <p className="text-transaction-date text-text-faint">
              {t('finance.availableLessBudget')}
            </p>
          )}
        </div>
        
        <div className="financial-metric">
          <div className="label-text mb-1">
            {t('finance.budgetStatus')}
          </div>
          <div className="text-balance-secondary font-bold mb-1">
            {t(`finance.${budgetStatus}`)}
          </div>
          {showExplanations && (
            <p className="text-transaction-date text-text-faint">
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
        <div className="heading-main">
          {t('finance.financialOverview')}
          {transactions.length === 0 && (
            <span className="text-xs text-secondary ml-2">({t('finance.noTransactionData')})</span>
          )}
        </div>
      </div>
      <div>{content}</div>
    </div>
  ) : (
    <Card className="animate-fade-in" style={{ boxShadow: '4px 4px 0px #000000' }}>
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="heading-main">
          {t('finance.financialOverview')}
          {transactions.length === 0 && (
            <span className="text-sm text-secondary ml-2">({t('finance.noTransactionData')})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};
