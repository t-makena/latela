
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/data";

const savingsBalanceData = [
  { month: 'Jan', balance: 14500 },
  { month: 'Feb', balance: 15000 },
  { month: 'Mar', balance: 15500 },
  { month: 'Apr', balance: 15180 },
  { month: 'May', balance: 15680 },
];

const dailySavingsData = [
  { day: 'Mon', balance: 15650 },
  { day: 'Tue', balance: 15660 },
  { day: 'Wed', balance: 15670 },
  { day: 'Thu', balance: 15675 },
  { day: 'Fri', balance: 15680 },
  { day: 'Sat', balance: 15680 },
  { day: 'Sun', balance: 15680 },
];

export const SavingsBalanceChart = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'1W' | '1M' | '3M' | '1Y'>('1M');

  const periods = [
    { key: '1W' as const, label: '1W' },
    { key: '1M' as const, label: '1M' },
    { key: '3M' as const, label: '3M' },
    { key: '1Y' as const, label: '1Y' },
  ];

  const getChartData = () => {
    if (selectedPeriod === '1W') {
      return dailySavingsData;
    }
    return savingsBalanceData;
  };

  const getXAxisKey = () => {
    return selectedPeriod === '1W' ? 'day' : 'month';
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle>Savings Balance Trend</CardTitle>
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
          <LineChart data={getChartData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={getXAxisKey()} />
            <YAxis />
            <Tooltip formatter={(value) => [`${formatCurrency(value as number)}`, "Balance"]} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#41b883" 
              strokeWidth={2} 
              dot={{ r: 4 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
