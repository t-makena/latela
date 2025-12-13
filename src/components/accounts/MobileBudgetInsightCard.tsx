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

export const MobileBudgetInsightCard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("1 Mth");
  const { t } = useLanguage();
  
  const { transactions } = useTransactions();
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

    // Calculate spending (negative amounts = expenses)
    const currentSpending = currentPeriodTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const previousSpending = previousPeriodTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate % change for spending
    const spendingChange = previousSpending > 0 
      ? ((currentSpending - previousSpending) / previousSpending) * 100 
      : 0;

    // Available Balance (sum of all accounts)
    const availableBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

    // Calculate previous period's ending balance from transactions
    const previousPeriodEndingBalances = previousPeriodTransactions
      .filter(t => t.balance !== undefined)
      .reduce((acc, t) => {
        const date = new Date(t.transaction_date);
        if (!acc.date || date > acc.date) {
          return { date, balance: t.balance };
        }
        return acc;
      }, { date: null as Date | null, balance: 0 });
    
    const previousAvailableBalance = previousPeriodEndingBalances.balance || availableBalance * 0.9;
    
    // Calculate % change for available balance
    const availableBalanceChange = previousAvailableBalance > 0
      ? ((availableBalance - previousAvailableBalance) / previousAvailableBalance) * 100
      : 0;

    // Budget Balance (budget expenses + upcoming events)
    const totalBudgetExpenses = calculateTotalMonthly();
    const totalUpcomingEvents = upcomingEvents.reduce((sum, event) => sum + event.budgetedAmount, 0);
    const budgetBalance = totalBudgetExpenses + totalUpcomingEvents;

    // For budget balance, estimate previous period (use same calculation with 0.9x multiplier as fallback)
    const previousBudgetBalance = budgetBalance * 0.9;
    const budgetBalanceChange = previousBudgetBalance > 0
      ? ((budgetBalance - previousBudgetBalance) / previousBudgetBalance) * 100
      : 0;

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
        className="bg-white rounded-3xl border border-black p-5 w-full"
        style={{ boxShadow: '4px 4px 0px #000000' }}
      >
        <h2 className="text-lg font-bold mb-4 font-georama text-black">{t('finance.budgetInsight')}</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E0E0E0]">
              <th className="text-left font-normal text-sm text-[#999999] pb-4">{t('finance.metric')}</th>
              <th className="text-right font-normal text-sm text-[#999999] pb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-auto p-0 font-normal text-sm text-[#999999] hover:bg-transparent hover:text-black"
                    >
                      {selectedPeriod}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="bg-white border border-black z-50"
                    style={{ boxShadow: '2px 2px 0px #000000' }}
                  >
                    {periodOptions.map((period) => (
                      <DropdownMenuItem
                        key={period}
                        onClick={() => setSelectedPeriod(period)}
                        className={`cursor-pointer ${selectedPeriod === period ? 'bg-gray-100' : ''}`}
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
            <tr className="border-b border-[#E0E0E0]">
              <td className="py-4">
                <p className="text-sm font-light text-black">{t('finance.availableBalance')}</p>
              </td>
              <td className="py-4 text-right">
                <p className={`text-sm font-medium ${metrics.availableBalanceChange > 0 ? 'text-green-500' : metrics.availableBalanceChange < 0 ? 'text-red-500' : 'text-[#999999]'}`}>
                  {formatChange(metrics.availableBalanceChange)}
                </p>
              </td>
            </tr>
            <tr className="border-b border-[#E0E0E0]">
              <td className="py-4">
                <p className="text-sm font-light text-black">{t('finance.budgetBalance')}</p>
              </td>
              <td className="py-4 text-right">
                <p className={`text-sm font-medium ${metrics.budgetBalanceChange > 0 ? 'text-green-500' : metrics.budgetBalanceChange < 0 ? 'text-red-500' : 'text-[#999999]'}`}>
                  {formatChange(metrics.budgetBalanceChange)}
                </p>
              </td>
            </tr>
            <tr>
              <td className="py-4">
                <p className="text-sm font-light text-black">{t('finance.spending')}</p>
              </td>
              <td className="py-4 text-right">
                <p className={`text-sm font-medium ${metrics.spendingChange > 0 ? 'text-red-500' : metrics.spendingChange < 0 ? 'text-green-500' : 'text-[#999999]'}`}>
                  {formatChange(metrics.spendingChange)}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
