import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChartCardLayout } from "@/components/ui/chart-card-layout";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics, formatCurrency } from "@/lib/realData";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  Cell, ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChartProps {
  type?: "line" | "bar" | "pie";
}

type PeriodKey = '1W' | '1M' | '6M' | '1Y';

export const SpendingChart = ({ type = "line" }: ChartProps) => {
  const { transactions } = useTransactions();
  const { monthlySpending, categoryBreakdownArray } = calculateFinancialMetrics(transactions);
  const isMobile = useIsMobile();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('1M');

  const periods: { key: PeriodKey; label: string }[] = [
    { key: '1W', label: '1W' },
    { key: '1M', label: '1M' },
    { key: '6M', label: '6M' },
    { key: '1Y', label: '1Y' },
  ];

  const getTitle = () => {
    switch (type) {
      case "line": return "Monthly Spending Trend";
      case "bar": return "Monthly Spending Comparison";
      case "pie": return "Spending by Category";
    }
  };
  
  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
            <LineChart data={monthlySpending}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? "end" : "middle"}
                height={isMobile ? 60 : 30}
              />
              <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 45 : 60} />
              <Tooltip formatter={(value) => [`${formatCurrency(value as number)}`, "Spending"]} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2} 
                dot={{ r: 4 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
            <BarChart data={monthlySpending}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? "end" : "middle"}
                height={isMobile ? 60 : 30}
              />
              <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 45 : 60} />
              <Tooltip formatter={(value) => [`${formatCurrency(value as number)}`, "Spending"]} />
              <Legend />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case "pie":
        const COLORS = ['hsl(var(--primary))', '#41b883', '#ff6b6b', '#ffd166', '#8959a8', '#6c757d'];
        
        return (
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <PieChart>
              <Pie
                data={categoryBreakdownArray}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={isMobile ? 70 : 100}
                fill="#8884d8"
                dataKey="value"
                label={isMobile ? false : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryBreakdownArray.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend 
                layout={isMobile ? "horizontal" : "vertical"}
                align={isMobile ? "center" : "right"}
                verticalAlign={isMobile ? "bottom" : "middle"}
                wrapperStyle={{ fontSize: isMobile ? '11px' : '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <ChartCardLayout
      title={getTitle()}
      subtitle={`over the past ${selectedPeriod === '1W' ? 'week' : selectedPeriod === '1M' ? 'month' : selectedPeriod === '6M' ? '6 months' : 'year'}`}
      className="mt-6"
      filters={
        <>
          {periods.map(period => (
            <Button
              key={period.key}
              variant={selectedPeriod === period.key ? "default" : "ghost"}
              size="sm"
              className="h-6 px-2 text-xs rounded-full"
              onClick={() => setSelectedPeriod(period.key)}
            >
              {period.label}
            </Button>
          ))}
        </>
      }
    >
      {renderChart()}
    </ChartCardLayout>
  );
};
