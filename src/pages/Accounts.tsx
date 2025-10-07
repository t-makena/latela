import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, CircleIcon, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Accounts = () => {
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState("1W");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWeekData, setSelectedWeekData] = useState<any>(null);

  // Mock data
  const accounts = [
    {
      id: 1,
      bankName: "Nedbank Bank Cheque Account",
      balance: 103779.00,
      logo: "N",
      paymentProvider: "mastercard"
    }
  ];

  const transactions = [
    {
      id: 1,
      category: "Housing & Utilities",
      categoryColor: "bg-blue-100 text-blue-700",
      name: "Rent",
      date: "27 June 2025",
      amount: -13000.00
    },
    {
      id: 2,
      category: "Savings & Investments",
      categoryColor: "bg-green-100 text-green-700",
      name: "Savings transfer",
      date: "27 June 2025",
      amount: -7000.00
    },
    {
      id: 3,
      category: "Personal & Lifestyle",
      categoryColor: "bg-orange-100 text-orange-700",
      name: "Futbol",
      date: "27 June 2025",
      amount: -85.00
    }
  ];

  // Category colors mapping
  const categoryColors = {
    "Food": "#10B981",
    "Transportation": "#F59E0B",
    "Personal & Lifestyle": "#8B5CF6",
    "Housing & Utilities": "#3B82F6",
    "Savings & Investments": "#10B981",
    "Entertainment": "#EC4899",
    "Healthcare": "#EF4444"
  };

  const chartData = [
    {
      week: "Week 1",
      dateRange: "2025-05-01 to 2025-05-07",
      total: 3348,
      "Food": 581,
      "Transportation": 494,
      "Personal & Lifestyle": 533,
      "Housing & Utilities": 289,
      "Entertainment": 451
    },
    {
      week: "Week 2",
      dateRange: "2025-05-08 to 2025-05-14",
      total: 2890,
      "Food": 620,
      "Transportation": 380,
      "Personal & Lifestyle": 420,
      "Housing & Utilities": 350,
      "Entertainment": 320,
      "Healthcare": 800
    },
    {
      week: "Week 3",
      dateRange: "2025-05-15 to 2025-05-21",
      total: 3120,
      "Food": 590,
      "Transportation": 510,
      "Personal & Lifestyle": 680,
      "Housing & Utilities": 400,
      "Entertainment": 290,
      "Healthcare": 650
    },
    {
      week: "Week 4",
      dateRange: "2025-05-22 to 2025-05-28",
      total: 2750,
      "Food": 540,
      "Transportation": 460,
      "Personal & Lifestyle": 550,
      "Housing & Utilities": 320,
      "Entertainment": 380,
      "Healthcare": 500
    }
  ];

  const categories = Object.keys(categoryColors);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const weekData = data.activePayload[0].payload;
      setSelectedWeekData(weekData);
      setIsModalOpen(true);
    }
  };

  const getCategoryBreakdown = () => {
    if (!selectedWeekData) return [];
    
    const breakdown = categories
      .map(category => ({
        category,
        amount: selectedWeekData[category] || 0,
        color: categoryColors[category as keyof typeof categoryColors],
        percentage: ((selectedWeekData[category] || 0) / selectedWeekData.total * 100).toFixed(0)
      }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    
    return breakdown;
  };

  const timeFilters = ["1W", "1M", "3M", "6M", "1Y"];

  const currentAccount = accounts[currentAccountIndex];

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pb-20 space-y-6">
        {/* Account Card */}
        <Card className="rounded-3xl border border-border shadow-lg bg-gray-50">
          <CardContent className="p-6">
            {/* Bank Name with Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-foreground rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">{currentAccount.logo}</span>
              </div>
              <h2 className="text-base font-bold text-foreground">{currentAccount.bankName}</h2>
            </div>

            {/* Budget Balance */}
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Budget Balance</p>
                <p className="text-4xl font-bold text-foreground">
                  R{currentAccount.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Available Balance: R{currentAccount.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Payment Provider Logo */}
              <div className="h-12 w-16 bg-foreground rounded-lg flex items-center justify-center">
                <div className="flex gap-1">
                  <div className="h-8 w-8 rounded-full bg-destructive opacity-80"></div>
                  <div className="h-8 w-8 rounded-full bg-secondary -ml-4"></div>
                </div>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {accounts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentAccountIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentAccountIndex 
                      ? 'w-6 bg-foreground' 
                      : 'w-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Recent transactions</h3>
          
          <div className="space-y-0 border-t border-border">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="py-4 border-b border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="secondary" className={`mb-2 text-xs font-medium ${transaction.categoryColor}`}>
                      {transaction.category}
                    </Badge>
                    <p className="font-semibold text-foreground text-base mb-1">
                      {transaction.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.date}
                    </p>
                  </div>
                  <p className="text-destructive font-bold text-base">
                    -R{Math.abs(transaction.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button className="text-sm text-foreground underline mt-3 font-medium">
            see more
          </button>
        </div>

        {/* Spending Trend Chart */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold text-foreground">Spending Trend</h3>
              <p className="text-xs text-muted-foreground">for the past month</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <CircleIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Chart */}
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} onClick={handleBarClick}>
                <XAxis 
                  dataKey="week" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Amount Spent', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 } }}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="circle"
                />
                {categories.map((category) => (
                  <Bar 
                    key={category}
                    dataKey={category} 
                    stackId="a" 
                    fill={categoryColors[category as keyof typeof categoryColors]}
                    radius={category === categories[categories.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Month Label */}
          <p className="text-center text-xs text-muted-foreground mt-2">Monthly Overview</p>

          {/* Time Filter Buttons */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="text-sm font-medium text-foreground">Filter By Past:</span>
            {timeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedTimeFilter(filter)}
                className={`text-sm font-bold transition-colors ${
                  selectedTimeFilter === filter 
                    ? 'text-foreground underline' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Account Insight */}
        <div className="pt-4">
          <h3 className="text-xl font-bold text-foreground mb-4">Account insight</h3>
          
          {/* Placeholder lines for insights */}
          <div className="space-y-3">
            <div className="h-0.5 bg-foreground w-full"></div>
            <div className="h-0.5 bg-foreground w-3/4"></div>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-bold">•</span>
              <div className="h-0.5 bg-foreground w-2/3"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Spending Details - {selectedWeekData?.week}
            </DialogTitle>
          </DialogHeader>
          
          {selectedWeekData && (
            <div className="space-y-6">
              {/* Total Amount */}
              <div className="text-center">
                <p className="text-4xl font-bold text-foreground">
                  R {selectedWeekData.total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Date: {selectedWeekData.dateRange}
                </p>
              </div>

              {/* Category Breakdown */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Category Breakdown</h4>
                <div className="space-y-3">
                  {getCategoryBreakdown().map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium text-foreground">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-foreground">
                          R {item.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;
