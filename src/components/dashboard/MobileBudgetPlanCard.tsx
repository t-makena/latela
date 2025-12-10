import { useBudgetItems } from "@/hooks/useBudgetItems";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/realData";

export const MobileBudgetPlanCard = () => {
  const { budgetItems, loading: budgetLoading, calculateMonthlyAmount } = useBudgetItems();
  const { transactions } = useTransactions();

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
      <div className="bg-white rounded-2xl border-2 border-[#E0E0E0] p-4 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-24 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-[#E0E0E0] p-4">
      <h2 className="text-base font-semibold mb-4 font-georama">Budget plan</h2>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left font-semibold text-sm pb-3 text-foreground">Category:</th>
            <th className="text-right font-semibold text-sm pb-3 text-foreground">Amount Spent:</th>
          </tr>
        </thead>
        <tbody>
          {budgetItems.length === 0 ? (
            <tr>
              <td colSpan={2} className="py-4 text-center text-sm text-muted-foreground">
                No budget items yet
              </td>
            </tr>
          ) : (
            budgetItems.map((item) => {
              const amountSpent = getAmountSpent(item.name);
              const monthlyBudget = calculateMonthlyAmount(item);
              const isOverBudget = amountSpent > monthlyBudget;
              
              return (
                <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="py-3 text-sm text-foreground">{item.name}</td>
                  <td className={`py-3 text-sm text-right font-medium ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
                    {formatCurrency(amountSpent)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
