import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useAnalyticsData, DatePreset, PRESET_LABELS } from "@/hooks/useAnalyticsData";
import { formatCurrency } from "@/lib/realData";
import { TrendingDown, Tag, Store, BarChart2 } from "lucide-react";

const PRESETS: DatePreset[] = ['30d', '90d', '6m', '12m'];

const Analytics = () => {
  const [activePreset, setActivePreset] = useState<DatePreset>('6m');
  const { data, isLoading } = useAnalyticsData(activePreset);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Visualize your financial data and identify trends</p>
        </div>
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={activePreset === p ? 'default' : 'outline'}
              onClick={() => setActivePreset(p)}
            >
              {PRESET_LABELS[p]}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-14 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <SummaryCard
              icon={TrendingDown}
              label="Total spent"
              value={formatCurrency(data?.totalSpent ?? 0)}
            />
            <SummaryCard
              icon={BarChart2}
              label="Avg per month"
              value={formatCurrency(data?.avgPerMonth ?? 0)}
            />
            <SummaryCard
              icon={Tag}
              label="Top category"
              value={data?.topCategory ?? '—'}
            />
            <SummaryCard
              icon={Store}
              label="Top merchant"
              value={data?.topMerchant ?? '—'}
              truncate
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly spending bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.monthlyData ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [formatCurrency(v as number), 'Spent']} />
                  <Bar dataKey="amount" fill="#1e65ff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category pie chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data?.categoryData ?? []}
                    cx="45%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    labelLine={false}
                  >
                    {(data?.categoryData ?? []).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [formatCurrency(v as number)]} />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top merchants */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : (data?.topMerchants ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No transactions in this period.</p>
          ) : (
            <div className="space-y-2">
              {(data?.topMerchants ?? []).map((m, i) => {
                const max = data!.topMerchants[0].amount;
                const pct = max > 0 ? (m.amount / max) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium truncate max-w-[200px]">{m.name}</span>
                        <span className="text-muted-foreground">{formatCurrency(m.amount)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  truncate,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-lg font-semibold leading-tight ${truncate ? 'truncate' : ''}`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Analytics;
