
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export const SpendingChart = ({ type = "line" }: ChartProps) => {
  const { transactions } = useTransactions();
  const { monthlySpending, categoryBreakdownArray } = calculateFinancialMetrics(transactions);
  const isMobile = useIsMobile();
  
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
                stroke="#1e65ff" 
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
              <Bar dataKey="amount" fill="#1e65ff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case "pie":
        const COLORS = ['#1e65ff', '#41b883', '#ff6b6b', '#ffd166', '#8959a8', '#6c757d'];
        
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
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle>
          {type === "line" && "Monthly Spending Trend"}
          {type === "bar" && "Monthly Spending Comparison"}
          {type === "pie" && "Spending by Category"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
};
