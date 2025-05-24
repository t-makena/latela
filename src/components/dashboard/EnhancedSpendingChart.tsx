
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { monthlySpending, dailySpending, formatCurrency, getTargetAverageExpense, categoryBreakdown } from "@/lib/data";
import { 
  LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Cell
} from "recharts";

interface EnhancedSpendingChartProps {
  accountSpecific?: boolean;
  accountId?: string;
}

export const EnhancedSpendingChart = ({ accountSpecific = false, accountId }: EnhancedSpendingChartProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'1W' | '1M' | '3M' | '1Y'>('1M');
  const [selectedBarData, setSelectedBarData] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const periods = [
    { key: '1W' as const, label: '1W' },
    { key: '1M' as const, label: '1M' },
    { key: '3M' as const, label: '3M' },
    { key: '1Y' as const, label: '1Y' },
  ];

  const getChartTitle = () => {
    if (selectedPeriod === '1W' || selectedPeriod === '1M') return 'Daily Spending Trend';
    if (selectedPeriod === '3M') return 'Quarterly Spending Trend';
    return 'Monthly Spending Trend';
  };

  const getChartData = () => {
    if (selectedPeriod === '1W' || selectedPeriod === '1M') {
      return dailySpending;
    }
    return monthlySpending;
  };

  const targetExpense = getTargetAverageExpense();

  const handleBarClick = (data: any) => {
    if (selectedPeriod === '1W' || selectedPeriod === '1M') {
      setSelectedBarData(data);
      setShowDetailModal(true);
    }
  };

  const COLORS = ['#1e65ff', '#41b883', '#ff6b6b', '#ffd166', '#8959a8'];

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <CardTitle>{getChartTitle()}</CardTitle>
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
          {selectedPeriod === '1W' || selectedPeriod === '1M' ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => [`${formatCurrency(value as number)}`, "Spending"]} />
                <Legend />
                <Bar 
                  dataKey="amount" 
                  onClick={handleBarClick}
                  style={{ cursor: 'pointer' }}
                >
                  {getChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  `${formatCurrency(value as number)}`, 
                  name === 'amount' ? 'Expenses' : name === 'savings' ? 'Savings' : 'Net Balance'
                ]} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#ff6b6b" 
                  strokeWidth={2} 
                  name="Expenses"
                />
                <Line 
                  type="monotone" 
                  dataKey="savings" 
                  stroke="#41b883" 
                  strokeWidth={2} 
                  name="Savings"
                />
                <Line 
                  type="monotone" 
                  dataKey="netBalance" 
                  stroke="#1e65ff" 
                  strokeWidth={2} 
                  name="Net Balance"
                />
                <Line 
                  type="monotone" 
                  dataKey={() => targetExpense} 
                  stroke="#ffd166" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  name="Target Average Expense"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spending Details - {selectedBarData?.day}</DialogTitle>
          </DialogHeader>
          {selectedBarData && (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold">
                  Total: {formatCurrency(selectedBarData.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Category: {selectedBarData.category}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Category Breakdown</h4>
                {categoryBreakdown.map((category, index) => {
                  const percentage = ((category.value / selectedBarData.amount) * 100).toFixed(1);
                  return (
                    <div key={category.name} className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <span className="text-sm">
                        {formatCurrency(category.value)} ({percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
