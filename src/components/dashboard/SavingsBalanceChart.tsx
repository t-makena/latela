
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { formatCurrency, savingsBalanceData, transactions, budgetGoals, formatDate } from "@/lib/data";

export const SavingsBalanceChart = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'1W' | '1M' | '3M' | '1Y'>('1M');

  const periods = [
    { key: '1W' as const, label: '1W' },
    { key: '1M' as const, label: '1M' },
    { key: '3M' as const, label: '3M' },
    { key: '1Y' as const, label: '1Y' },
  ];

  const savingsTransactions = transactions.filter(t => t.accountId === '2');

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle>Savings Balance & Transactions</CardTitle>
          <div className="flex gap-1">
            {periods.map((period) => (
              <Button
                key={period.key}
                variant={selectedPeriod === period.key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period.key)}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={savingsBalanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`${formatCurrency(value as number)}`, "Balance"]} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#41b883" 
              strokeWidth={2} 
              dot={{ r: 4 }} 
              name="Savings Balance"
            />
            <Line 
              type="monotone" 
              dataKey="transfers" 
              stroke="#ff6b6b" 
              strokeWidth={2} 
              dot={{ r: 4 }} 
              strokeDasharray="3 3"
              name="After Transfers Out"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-6">
          <h3 className="font-semibold mb-3">Recent Transactions</h3>
          
          {savingsTransactions.length > 0 ? (
            <div className="space-y-3">
              {savingsTransactions.map(transaction => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline" className="capitalize">
                        {transaction.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(transaction.date)}
                      </span>
                    </div>
                  </div>
                  <div className={`font-bold ${transaction.type === 'expense' ? 'text-destructive' : 'text-budget-income'}`}>
                    {transaction.type === 'expense' ? '-' : '+'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">
              No transactions found for this account.
            </p>
          )}
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3">Budget Goals</h3>
          <div className="space-y-5">
            {budgetGoals.map((goal) => {
              const percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{goal.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)} ({percentage}%)
                        {goal.endDate && ` • Due ${formatDate(goal.endDate)}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="progress-bar">
                    <div 
                      className="progress-value"
                      style={{ 
                        width: `${Math.min(100, percentage)}%`,
                        backgroundColor: goal.color 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
