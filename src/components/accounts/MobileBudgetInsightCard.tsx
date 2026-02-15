import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useBudgetItems } from "@/hooks/useBudgetItems";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useLanguage } from "@/hooks/useLanguage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type PeriodOption = "1 Mth" | "3 Mth" | "6 Mth" | "1 Yr";

export const MobileBudgetInsightCard = ({ titleKey = 'finance.budgetInsight' }: { titleKey?: string }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("1 Mth");
  const { t } = useLanguage();
  
  const { transactions } = useTransactions({ currentMonthOnly: false, limit: 2000 });
  const { accounts } = useAccounts();
  const { calculateTotalMonthly } = useBudgetItems();
  const currentDate = new Date();
  const { upcomingEvents } = useCalendarEvents({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1
  });

  // Calculate period in months
  const getPeriodMonths = (period: PeriodOption): number => {
    switch (period) {
      case "1 Mth": return 1;
      case "3 Mth": return 3;
      case "6 Mth": return 6;
      case "1 Yr": return 12;
      default: return 1;
    }
  };

  const getPeriodLabel = (period: PeriodOption): string => {
    switch (period) {
      case "1 Mth": return t('budget.oneMonthChange');
      case "3 Mth": return t('budget.threeMonthChange');
      case "6 Mth": return t('budget.sixMonthChange');
      case "1 Yr": return t('budget.oneYearChange');
      default: return t('budget.oneMonthChange');
    }
  };

  const periodMonths = getPeriodMonths(selectedPeriod);

  // Calculate metrics with period comparison
  const metrics = useMemo(() => {
    const now = new Date();
    const currentPeriodStart = new Date(now.getFullYear(), now.getMonth() - periodMonths + 1, 1);
    const previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - (periodMonths * 2) + 1, 1);
    const previousPeriodEnd = new Date(now.getFullYear(), now.getMonth() - periodMonths + 1, 0);

    // Filter transactions for current and previous periods
    const currentPeriodTransactions = transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date >= currentPeriodStart && date <= now;
    });

    const previousPeriodTransactions = transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date >= previousPeriodStart && date <= previousPeriodEnd;
    });

    const hasPreviousData = previousPeriodTransactions.length > 0;
    const hasCurrentData = currentPeriodTransactions.length > 0;

    // Calculate spending (negative amounts = expenses)
    const currentSpending = currentPeriodTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const previousSpending = previousPeriodTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Spending change: null if no data in either period
    const spendingChange: number | null = (!hasCurrentData || !hasPreviousData)
      ? null
      : previousSpending > 0
        ? ((currentSpending - previousSpending) / previousSpending) * 100
        : null;

    // Available Balance (sum of all accounts)
    const availableBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

    // Use actual previous-period ending balance; null if no previous data
    let availableBalanceChange: number | null = null;
    if (hasPreviousData) {
      const previousPeriodEndingBalances = previousPeriodTransactions
        .filter(t => t.balance != null)
        .reduce((acc, t) => {
          const date = new Date(t.transaction_date);
          if (!acc.date || date > acc.date) {
            return { date, balance: t.balance ?? 0 };
          }
          return acc;
        }, { date: null as Date | null, balance: 0 });

      if (previousPeriodEndingBalances.date && previousPeriodEndingBalances.balance !== 0) {
        availableBalanceChange = ((availableBalance - previousPeriodEndingBalances.balance) / Math.abs(previousPeriodEndingBalances.balance)) * 100;
      }
    }

    // Budget Balance — no historical snapshots, always N/A
    const totalBudgetExpenses = calculateTotalMonthly();
    const totalUpcomingEvents = upcomingEvents.reduce((sum, event) => sum + event.budgetedAmount, 0);
    const budgetBalance = totalBudgetExpenses + totalUpcomingEvents;
    const budgetBalanceChange: number | null = null;

    return {
      availableBalance,
      availableBalanceChange,
      budgetBalance,
      budgetBalanceChange,
      spending: currentSpending,
      spendingChange,
    };
  }, [transactions, accounts, calculateTotalMonthly, upcomingEvents, periodMonths]);

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  const periodOptions: PeriodOption[] = ["1 Mth", "3 Mth", "6 Mth", "1 Yr"];

  return (
    <div className="animate-fade-in w-full">
      <div 
        className="bg-card rounded-3xl border border-foreground p-5 w-full"
      >
        <h2 className="heading-card mb-4">{t(titleKey)}</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left table-header-text pb-4">{t('budget.metric')}</th>
              <th className="text-right table-header-text pb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-auto p-0 table-header-text hover:bg-transparent hover:text-foreground"
                    >
                      {selectedPeriod}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="bg-card border border-foreground z-50"
                  >
                    {periodOptions.map((period) => (
                      <DropdownMenuItem
                        key={period}
                        onClick={() => setSelectedPeriod(period)}
                        className={`cursor-pointer ${selectedPeriod === period ? 'bg-muted' : ''}`}
                      >
                        {period}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-4">
                <p className="table-body-text">{t('finance.availableBalance')}</p>
              </td>
              <td className="py-4 text-right">
                <p className={`percentage-text ${metrics.availableBalanceChange === null ? 'percentage-neutral' : metrics.availableBalanceChange > 0 ? 'percentage-positive' : metrics.availableBalanceChange < 0 ? 'percentage-negative' : 'percentage-neutral'}`}>
                  {metrics.availableBalanceChange === null ? "N/A" : formatChange(metrics.availableBalanceChange)}
                </p>
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-4">
                <p className="table-body-text">{t('finance.budgetBalance')}</p>
              </td>
              <td className="py-4 text-right">
                <p className={`percentage-text ${metrics.budgetBalanceChange === null ? 'percentage-neutral' : metrics.budgetBalanceChange > 0 ? 'percentage-positive' : metrics.budgetBalanceChange < 0 ? 'percentage-negative' : 'percentage-neutral'}`}>
                  {metrics.budgetBalanceChange === null ? "N/A" : formatChange(metrics.budgetBalanceChange)}
                </p>
              </td>
            </tr>
            <tr>
              <td className="py-4">
                <p className="table-body-text">{t('finance.spending')}</p>
              </td>
              <td className="py-4 text-right">
                <p className={`percentage-text ${metrics.spendingChange === null ? 'percentage-neutral' : metrics.spendingChange > 0 ? 'percentage-negative' : metrics.spendingChange < 0 ? 'percentage-positive' : 'percentage-neutral'}`}>
                  {metrics.spendingChange === null ? "N/A" : formatChange(metrics.spendingChange)}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
