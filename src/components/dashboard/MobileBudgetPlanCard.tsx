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
      <div className="animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-24 mb-3"></div>
        <div 
          className="bg-white rounded-3xl border border-black p-5 min-h-[400px]"
          style={{ boxShadow: '4px 4px 0px #000000' }}
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
      <h2 className="text-lg font-bold mb-3 font-georama text-black">Budget plan</h2>
      <div 
        className="bg-white rounded-3xl border border-black p-5 min-h-[400px] w-full"
        style={{ boxShadow: '4px 4px 0px #000000' }}
      >
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left font-normal text-sm pb-4 text-black">Category:</th>
              <th className="text-right font-normal text-sm pb-4 text-black">Amount Spent:</th>
            </tr>
          </thead>
          <tbody>
            {budgetItems.map((item) => {
              const amountSpent = getAmountSpent(item.name);
              const monthlyBudget = calculateMonthlyAmount(item);
              const isOverBudget = amountSpent > monthlyBudget;
              
              return (
                <tr key={item.id}>
                  <td className="py-3 text-sm text-black">{item.name}</td>
                  <td className={`py-3 text-sm text-right font-medium ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
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
