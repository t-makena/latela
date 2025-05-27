
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { savingsBalanceData, formatCurrency, budgetGoals } from "@/lib/data";
import { 
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from "recharts";

export const SavingsBalanceChart = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'1W' | '1M' | '6M' | '1Y'>('6M');

  const periods = [
    { key: '1W' as const, label: '1W' },
    { key: '1M' as const, label: '1M' },
    { key: '6M' as const, label: '6M' },
    { key: '1Y' as const, label: '1Y' },
  ];

  const getChartData = () => {
    // For now, returning the same data for all periods
    // This would be replaced with actual filtered data based on the selected period
    return savingsBalanceData;
  };

  const savingsGoals = budgetGoals.filter(goal => goal.category === 'Savings');

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={getChartData()}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value, name) => [
            `${formatCurrency(value as number)}`, 
            name === 'balance' ? 'Balance' : 'Transfers Out'
          ]} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="balance" 
            stroke="#41b883" 
            strokeWidth={2} 
            name="Balance"
          />
          <Line 
            type="monotone" 
            dataKey="transfersOut" 
            stroke="#ff6b6b" 
            strokeWidth={2} 
            name="Transfers Out"
          />
        </LineChart>
      </ResponsiveContainer>

      {savingsGoals.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-3">Budget Goals</h4>
          <div className="space-y-3">
            {savingsGoals.map((goal) => {
              const percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
              const endDate = goal.endDate ? new Date(goal.endDate) : null;
              const formattedDate = endDate ? 
                `${endDate.getDate()} ${endDate.toLocaleDateString('en-US', { month: 'short' })} ${endDate.getFullYear()}` : 
                'No deadline';
              
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-sm text-muted-foreground">{formattedDate}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>
                      {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)} ({percentage}%)
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-value" 
                      style={{ 
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: goal.color 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
