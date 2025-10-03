import { TrendingUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const FinancialInsight = () => {
  const spendingTrendData = [
    { day: "Mon", amount: 850 },
    { day: "Tue", amount: 1500 },
    { day: "Wed", amount: 1100 },
    { day: "Thu", amount: 600 },
    { day: "Fri", amount: 1000 },
    { day: "Sat", amount: 1400 },
    { day: "Sun", amount: 1800 }
  ];

  const categoryData = [
    { category: "F&G", amount: 1200, color: "bg-orange-500" },
    { category: "P&L", amount: 1100, color: "bg-green-600" },
    { category: "H&U", amount: 1600, color: "bg-red-500" },
    { category: "T/F", amount: 1400, color: "bg-blue-700" },
    { category: "Misc", amount: 1500, color: "bg-black" }
  ];

  const maxSpending = Math.max(...spendingTrendData.map(d => d.amount));
  const maxCategory = Math.max(...categoryData.map(d => d.amount));

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
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold">Spending Trend</h2>
            <p className="text-xs text-muted-foreground">for the past week</p>
          </div>
          <Info className="h-4 w-4" />
        </div>

        <div className="relative pt-8 pb-4">
          {/* Y-axis label */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Amount Spent</span>
          </div>

          {/* Chart */}
          <div className="ml-8 mr-4">
            <div className="flex items-end justify-between gap-2 h-48 border-l border-b border-foreground/20 pl-4 pb-2">
              {spendingTrendData.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center h-full">
                    <div 
                      className="w-full max-w-[40px] bg-foreground rounded-t"
                      style={{ height: `${(item.amount / maxSpending) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs">{item.day}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">Week to Date</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm mt-4">
          <span className="text-muted-foreground">Filter By Past:</span>
          <Button variant="link" className="h-auto p-0 underline font-semibold">1W</Button>
          <Button variant="link" className="h-auto p-0 font-semibold">1M</Button>
          <Button variant="link" className="h-auto p-0 font-semibold">3M</Button>
          <Button variant="link" className="h-auto p-0 font-semibold">6M</Button>
          <Button variant="link" className="h-auto p-0 font-semibold">1Y</Button>
        </div>
      </div>

      {/* Spending By Category Chart */}
      <div>
        <div>
          <h2 className="text-lg font-semibold">Spending By Category</h2>
          <p className="text-xs text-muted-foreground">for the past week</p>
        </div>

        <div className="relative pt-8 pb-4 mt-4">
          {/* Y-axis label */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Amount Spent</span>
          </div>

          {/* Chart */}
          <div className="ml-8 mr-4">
            <div className="flex items-end justify-between gap-3 h-48 border-l border-b border-foreground/20 pl-4 pb-2">
              {categoryData.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center h-full">
                    <div 
                      className={`w-full max-w-[50px] ${item.color} rounded-t`}
                      style={{ height: `${(item.amount / maxCategory) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{item.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm mt-4">
          <span className="text-muted-foreground">Filter By Past:</span>
          <Button variant="link" className="h-auto p-0 underline font-semibold">1W</Button>
          <Button variant="link" className="h-auto p-0 font-semibold">1M</Button>
          <Button variant="link" className="h-auto p-0 font-semibold">3M</Button>
          <Button variant="link" className="h-auto p-0 font-semibold">6M</Button>
          <Button variant="link" className="h-auto p-0 font-semibold">1Y</Button>
        </div>
      </div>
    </div>
  );
};

export default FinancialInsight;