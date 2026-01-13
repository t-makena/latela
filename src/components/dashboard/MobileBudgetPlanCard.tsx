import { useBudgetItems } from "@/hooks/useBudgetItems";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/realData";
import { useLanguage } from "@/hooks/useLanguage";

export const MobileBudgetPlanCard = () => {
  const { budgetItems, loading: budgetLoading, calculateMonthlyAmount } = useBudgetItems();
  const { transactions } = useTransactions();
  const { t } = useLanguage();

  // Calculate amount spent per budget item based on transaction matching
  const getAmountSpent = (itemName: string): number => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.transaction_date);
        const isCurrentMonth = transactionDate.getMonth() === currentMonth && 
                              transactionDate.getFullYear() === currentYear;
        const isExpense = t.amount < 0;
        
        // Match by category name, subcategory, or description
        const nameMatch = 
          t.parent_category_name?.toLowerCase().includes(itemName.toLowerCase()) ||
          t.subcategory_name?.toLowerCase().includes(itemName.toLowerCase()) ||
          t.display_subcategory_name?.toLowerCase().includes(itemName.toLowerCase()) ||
          t.description?.toLowerCase().includes(itemName.toLowerCase());
        
        return isCurrentMonth && isExpense && nameMatch;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  if (budgetLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-24 mb-3"></div>
        <div 
          className="bg-white rounded-3xl border border-black p-5"
        >
          <div className="flex justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full">
      <div 
        className="bg-card rounded-3xl border border-foreground p-5 w-full"
        
      >
        <h2 className="heading-card mb-4">{t('finance.budgetPlan')}</h2>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left table-header-text pb-4">{t('finance.category')}:</th>
              <th className="text-right table-header-text pb-4">{t('finance.amountSpent')}:</th>
            </tr>
          </thead>
          <tbody>
            {budgetItems.map((item) => {
              const amountSpent = getAmountSpent(item.name);
              const monthlyBudget = calculateMonthlyAmount(item);
              const isOverBudget = amountSpent > monthlyBudget;
              
              return (
                <tr key={item.id}>
                  <td className="py-3 table-body-text font-medium">{item.name}</td>
                  <td className={`py-3 table-body-text text-right font-medium currency ${isOverBudget ? 'text-negative' : 'text-positive'}`}>
                    {formatCurrency(amountSpent)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
    </div>
  );
};
