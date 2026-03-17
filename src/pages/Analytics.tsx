import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, DollarSign, Hash, Tag } from "lucide-react";

type DatePreset = 'this-month' | 'last-month' | 'last-3' | 'last-6' | 'ytd';

const presets: { key: DatePreset; label: string }[] = [
  { key: 'this-month', label: 'This Month' },
  { key: 'last-month', label: 'Last Month' },
  { key: 'last-3', label: 'Last 3 Months' },
  { key: 'last-6', label: 'Last 6 Months' },
  { key: 'ytd', label: 'Year to Date' },
];

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(210, 70%, 50%)',
  'hsl(150, 60%, 45%)',
  'hsl(30, 80%, 55%)',
  'hsl(340, 70%, 50%)',
  'hsl(260, 60%, 55%)',
  'hsl(180, 50%, 45%)',
];

function getDateRange(preset: DatePreset): { startDate: Date; endDate: Date } {
  const now = new Date();
  switch (preset) {
    case 'this-month':
      return { startDate: startOfMonth(now), endDate: now };
    case 'last-month': {
      const last = subMonths(now, 1);
      return { startDate: startOfMonth(last), endDate: endOfMonth(last) };
    }
    case 'last-3':
      return { startDate: startOfMonth(subMonths(now, 2)), endDate: now };
    case 'last-6':
      return { startDate: startOfMonth(subMonths(now, 5)), endDate: now };
    case 'ytd':
      return { startDate: startOfYear(now), endDate: now };
  }
}

const formatCurrency = (cents: number) => {
  const rands = cents / 100;
  return `R${rands.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const Analytics = () => {
  const [activePreset, setActivePreset] = useState<DatePreset>('this-month');
  const { startDate, endDate } = getDateRange(activePreset);
  const { categoryData, monthlyTrends, topMerchants, dailySpending, isLoading } = useAnalyticsData({ startDate, endDate });

  // Summary calculations
  const totalSpendCents = categoryData.reduce((sum: number, c: any) => sum + Number(c.total_amount_cents || 0), 0);
  const totalTransactions = categoryData.reduce((sum: number, c: any) => sum + Number(c.transaction_count || 0), 0);
  const daysInRange = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const avgDailySpendCents = totalSpendCents / daysInRange;
  const topCategory = categoryData.length > 0 ? (categoryData[0] as any).category_name : '—';

  // Chart data transforms
  const pieData = categoryData.map((c: any) => ({
    name: c.category_name,
    value: Number(c.total_amount_cents) / 100,
    color: c.category_color,
  }));

  const barData = [...(monthlyTrends as any[])].reverse().map((m: any) => ({
    month: m.month_year,
    income: Number(m.total_income_cents) / 100,
    expenses: Number(m.total_expenses_cents) / 100,
  }));

  const areaData = (dailySpending as any[]).map((d: any) => ({
    date: d.spend_date,
    amount: Number(d.total_amount_cents) / 100,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6 pt-6 px-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Visualize your financial data and identify trends</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const hasData = categoryData.length > 0 || (monthlyTrends as any[]).length > 0;

  return (
    <div className="space-y-6 pt-6 px-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Visualize your financial data and identify trends</p>
      </div>

      {/* Date presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map(p => (
          <Button
            key={p.key}
            size="sm"
            variant={activePreset === p.key ? 'default' : 'outline'}
            onClick={() => setActivePreset(p.key)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {!hasData ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            No transactions found for this period. Upload a bank statement to get started!
          </p>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <DollarSign className="h-4 w-4" /> Total Spend
              </div>
              <p className="text-xl font-bold">{formatCurrency(totalSpendCents)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="h-4 w-4" /> Avg Daily
              </div>
              <p className="text-xl font-bold">{formatCurrency(avgDailySpendCents)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Hash className="h-4 w-4" /> Transactions
              </div>
              <p className="text-xl font-bold">{totalTransactions}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Tag className="h-4 w-4" /> Top Category
              </div>
              <p className="text-xl font-bold truncate">{topCategory}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Spending by Category - Pie */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R${value.toLocaleString('en-ZA')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">No data</p>
                )}
              </CardContent>
            </Card>

            {/* Monthly Trends - Bar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={barData}>
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => `R${value.toLocaleString('en-ZA')}`} />
                      <Bar dataKey="income" name="Income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">No data</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily Spending Area Chart */}
          {areaData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Daily Spending</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={areaData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R${v}`} />
                    <Tooltip formatter={(value: number) => `R${value.toLocaleString('en-ZA')}`} />
                    <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Merchants */}
          {(topMerchants as any[]).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Merchants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(topMerchants as any[]).map((m: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-mono w-5">{i + 1}</span>
                        <span className="text-sm font-medium truncate max-w-[200px]">{m.merchant_name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">{formatCurrency(Number(m.total_amount_cents))}</span>
                        <span className="text-xs text-muted-foreground ml-2">({m.transaction_count} txns)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;
