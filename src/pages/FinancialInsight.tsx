import { TrendingUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

const FinancialInsight = () => {
  // Stacked bar chart data for spending trend (Mon-Sun)
  const spendingTrendData = [
    { day: "Mon", "F&G": 300, "P&L": 200, "H&U": 250, "T/F": 100, Misc: 0 },
    { day: "Tue", "F&G": 400, "P&L": 300, "H&U": 450, "T/F": 200, Misc: 0 },
    { day: "Wed", "F&G": 350, "P&L": 250, "H&U": 0, "T/F": 350, Misc: 0 },
    { day: "Thu", "F&G": 300, "P&L": 200, "H&U": 0, "T/F": 200, Misc: 0 },
    { day: "Fri", "F&G": 400, "P&L": 0, "H&U": 300, "T/F": 350, Misc: 0 },
    { day: "Sat", "F&G": 500, "P&L": 400, "H&U": 0, "T/F": 400, Misc: 0 },
    { day: "Sun", "F&G": 600, "P&L": 450, "H&U": 300, "T/F": 200, Misc: 0 }
  ];

  // Category data for spending by category chart
  const categoryData = [
    { category: "F&G", amount: 2850, color: "#10B981" },
    { category: "P&L", amount: 1800, color: "#8B5CF6" },
    { category: "H&U", amount: 1300, color: "#3B82F6" },
    { category: "T/F", amount: 1800, color: "#F59E0B" },
    { category: "Misc", amount: 500, color: "#EF4444" }
  ];

  // Category colors for stacked bars
  const categoryColors = {
    "F&G": "#10B981",
    "P&L": "#8B5CF6",
    "H&U": "#3B82F6",
    "T/F": "#F59E0B",
    "Misc": "#EF4444"
  };

  const handleBarClick = (data: any) => {
    console.log("Bar clicked:", data);
    // Future modal implementation
  };

  return (
    <div className="space-y-6 relative z-10">
      {/* Financial Insight Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5" />
          <h1 className="text-xl font-georama font-semibold">Financial insight</h1>
        </div>
        
        <div className="border-b border-foreground mb-4" />
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">•</span>
              <div className="h-2.5 bg-muted rounded flex-1 max-w-[200px]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">•</span>
              <div className="h-2.5 bg-muted rounded flex-1 max-w-[280px]" />
            </div>
          </div>
          
          <div className="border-b border-foreground/20" />
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-sm">1.</span>
              <div className="h-2.5 bg-muted rounded flex-1 max-w-[220px]" />
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm">2.</span>
              <div className="h-2.5 bg-muted rounded flex-1 max-w-[320px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Spending Trend Chart */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Spending Trend</h2>
            <p className="text-xs text-muted-foreground">for the past week</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Filter By Past:</span>
            <Button variant="link" className="h-auto p-0 underline font-semibold">1W</Button>
            <Button variant="link" className="h-auto p-0 font-semibold">1M</Button>
            <Button variant="link" className="h-auto p-0 font-semibold">3M</Button>
            <Button variant="link" className="h-auto p-0 font-semibold">6M</Button>
            <Button variant="link" className="h-auto p-0 font-semibold">1Y</Button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={spendingTrendData} onClick={handleBarClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis 
              dataKey="day" 
              tick={{ fill: 'hsl(var(--foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              label={{ 
                value: 'Amount Spent (ZAR)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))' }
              }}
              tick={{ fill: 'hsl(var(--foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number) => `R${value}`}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  "F&G": "Food & Groceries",
                  "P&L": "Personal & Lifestyle",
                  "H&U": "Housing & Utilities",
                  "T/F": "Transport/Fuel",
                  "Misc": "Miscellaneous"
                };
                return labels[value] || value;
              }}
            />
            <Bar dataKey="F&G" stackId="a" fill={categoryColors["F&G"]} cursor="pointer" />
            <Bar dataKey="P&L" stackId="a" fill={categoryColors["P&L"]} cursor="pointer" />
            <Bar dataKey="H&U" stackId="a" fill={categoryColors["H&U"]} cursor="pointer" />
            <Bar dataKey="T/F" stackId="a" fill={categoryColors["T/F"]} cursor="pointer" />
            <Bar dataKey="Misc" stackId="a" fill={categoryColors["Misc"]} cursor="pointer" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Spending By Category Chart */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Spending By Category</h2>
            <p className="text-xs text-muted-foreground">for the past week</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Filter By Past:</span>
            <Button variant="link" className="h-auto p-0 underline font-semibold">1W</Button>
            <Button variant="link" className="h-auto p-0 font-semibold">1M</Button>
            <Button variant="link" className="h-auto p-0 font-semibold">3M</Button>
            <Button variant="link" className="h-auto p-0 font-semibold">6M</Button>
            <Button variant="link" className="h-auto p-0 font-semibold">1Y</Button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData} onClick={handleBarClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis 
              dataKey="category" 
              tick={{ fill: 'hsl(var(--foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              label={{ 
                value: 'Amount Spent (ZAR)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))' }
              }}
              tick={{ fill: 'hsl(var(--foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number) => `R${value.toLocaleString()}`}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  "F&G": "Food & Groceries",
                  "P&L": "Personal & Lifestyle",
                  "H&U": "Housing & Utilities",
                  "T/F": "Transport/Fuel",
                  "Misc": "Miscellaneous"
                };
                return labels[value] || value;
              }}
            />
            <Bar dataKey="amount" cursor="pointer">
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinancialInsight;