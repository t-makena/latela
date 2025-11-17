import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";

interface BudgetBreakdownProps {
  availableBalance: number;
  budgetBalance: number;
  spending: number;
  previousMonth: {
    availableBalance: number;
    budgetBalance: number;
    spending: number;
  };
  showOnlyPieChart?: boolean;
  showOnlyTable?: boolean;
}

export const BudgetBreakdown = ({ 
  availableBalance, 
  budgetBalance, 
  spending,
  previousMonth,
  showOnlyPieChart = false,
  showOnlyTable = false
}: BudgetBreakdownProps) => {
  const isMobile = useIsMobile();
  
  // Calculate percentage changes
  const availableChange = previousMonth.availableBalance 
    ? ((availableBalance - previousMonth.availableBalance) / previousMonth.availableBalance * 100).toFixed(0)
    : 0;
  const budgetChange = previousMonth.budgetBalance
    ? ((budgetBalance - previousMonth.budgetBalance) / previousMonth.budgetBalance * 100).toFixed(0)
    : 0;
  const spendingChange = previousMonth.spending
    ? ((spending - previousMonth.spending) / previousMonth.spending * 100).toFixed(0)
    : 0;

  // Pie chart data
  const total = availableBalance + budgetBalance + (spending * 0.4055) + (spending * 0.2845) + (spending * 0.20);
  const pieData = [
    { name: "Available Balance", value: availableBalance, color: "#9CA3AF" },
    { name: "Budget Balance", value: budgetBalance, color: "#EF4444" },
    { name: "Necessities", value: spending * 0.4055, color: "#3B82F6" },
    { name: "Discretionary", value: spending * 0.2845, color: "#F97316" },
    { name: "Savings", value: spending * 0.20, color: "#10B981" }
  ];

  const renderCustomLabel = (entry: any) => {
    const percent = ((entry.value / total) * 100).toFixed(2);
    return `${percent}%`;
  };

  if (showOnlyPieChart) {
    return (
      <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={isMobile ? 60 : 80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend 
            layout={isMobile ? "horizontal" : "vertical"}
            align={isMobile ? "center" : "right"}
            verticalAlign={isMobile ? "bottom" : "middle"}
            iconType="circle"
            formatter={(value) => <span className="text-xs">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (showOnlyTable) {
    return (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Metric</TableHead>
              <TableHead className="text-right">1 Mth Chng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Available Balance</TableCell>
              <TableCell className={`text-right font-semibold ${Number(availableChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(availableChange) >= 0 ? '+' : ''}{availableChange}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Budget Balance</TableCell>
              <TableCell className={`text-right font-semibold ${Number(budgetChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(budgetChange) >= 0 ? '+' : ''}{budgetChange}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Spending</TableCell>
              <TableCell className={`text-right font-semibold ${Number(spendingChange) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(spendingChange) >= 0 ? '+' : ''}{spendingChange}%
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Insight Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Budget Insight</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Metric</TableHead>
              <TableHead className="text-right">1 Mth Chng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Available Balance</TableCell>
              <TableCell className={`text-right font-semibold ${Number(availableChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(availableChange) >= 0 ? '+' : ''}{availableChange}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Budget Balance</TableCell>
              <TableCell className={`text-right font-semibold ${Number(budgetChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(budgetChange) >= 0 ? '+' : ''}{budgetChange}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Spending</TableCell>
              <TableCell className={`text-right font-semibold ${Number(spendingChange) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(spendingChange) >= 0 ? '+' : ''}{spendingChange}%
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Budget Pie Chart */}
      <div>
        <h3 className="text-sm font-semibold">Budget Allocation</h3>
        <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={isMobile ? 60 : 80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend 
              layout={isMobile ? "horizontal" : "vertical"}
              align={isMobile ? "center" : "left"}
              verticalAlign={isMobile ? "bottom" : "top"}
              iconType="circle"
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
