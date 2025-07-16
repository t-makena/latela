
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics, formatCurrency } from "@/lib/realData";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  Cell, ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from "recharts";

interface ChartProps {
  type?: "line" | "bar" | "pie";
}

export const SpendingChart = ({ type = "line" }: ChartProps) => {
  const { transactions } = useTransactions();
  const { monthlySpending, categoryBreakdownArray } = calculateFinancialMetrics(transactions);
  
  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySpending}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySpending}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${formatCurrency(value as number)}`, "Spending"]} />
              <Legend />
              <Bar dataKey="amount" fill="#1e65ff" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case "pie":
        const COLORS = ['#1e65ff', '#41b883', '#ff6b6b', '#ffd166', '#8959a8', '#6c757d'];
        
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryBreakdownArray}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryBreakdownArray.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
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
