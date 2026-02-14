import { forwardRef } from "react";
import { formatCurrency } from "@/lib/realData";
import latelaLogo from "@/assets/latela-logo.png";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

// ── Interfaces ──────────────────────────────────────────

interface FinancialSummary {
  availableBalance: number;
  budgetBalance: number;
  flexibleBalance: number;
  totalScore: number;
  riskLevel: string;
}

interface BudgetItemRow {
  name: string;
  frequency: string;
  amount: number;
  monthlyAmount: number;
}

interface GoalRow {
  name: string;
  monthlyAllocation: number;
  amountSaved: number;
  target: number;
  timeline: string;
  progress: number;
}

interface CategoryBreakdownItem {
  name: string;
  value: number;
  color: string;
}

interface SpendingChartDataPoint {
  month: string;
  total: number;
  [key: string]: unknown;
}

interface BalanceChartDataPoint {
  month: string;
  availableBalance: number;
  savingsBalance: number;
}

interface TransactionRow {
  date: string;
  description: string;
  category: string;
  amount: number;
  balance: number | null;
}

interface PrintableReportProps {
  userName: string;
  financialSummary: FinancialSummary;
  budgetItems: BudgetItemRow[];
  goals: GoalRow[];
  totalMonthlyBudget: number;
  totalMonthlySavings: number;
  // New chart/table data
  categoryBreakdown?: CategoryBreakdownItem[];
  spendingChartData?: SpendingChartDataPoint[];
  balanceChartData?: BalanceChartDataPoint[];
  transactions?: TransactionRow[];
}

const riskLevelLabels: Record<string, string> = {
  safe: "Safe",
  mild: "Mild Risk",
  moderate: "Moderate Risk",
  high: "High Risk",
  critical: "Critical",
};

const CHART_W = 700;
const CHART_H = 250;

const SPENDING_COLORS = [
  "#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#64748b",
];

// ── Component ───────────────────────────────────────────

export const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(
  (
    {
      userName,
      financialSummary,
      budgetItems,
      goals,
      totalMonthlyBudget,
      totalMonthlySavings,
      categoryBreakdown = [],
      spendingChartData = [],
      balanceChartData = [],
      transactions = [],
    },
    ref
  ) => {
    const today = new Date().toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    return (
      <div
        ref={ref}
        className="printable-report hidden print:block bg-white text-black p-8 max-w-[800px] mx-auto"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-black pb-4">
          <div className="flex items-center gap-3">
            <img src={latelaLogo} alt="Latela" className="h-10 w-10" />
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cooper BT', serif" }}>
              Latela Financial Report
            </h1>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">{userName}</p>
            <p className="text-gray-600">{today}</p>
          </div>
        </div>

        {/* ── Financial Overview ── */}
        <Section title="Financial Overview">
          <div className="grid grid-cols-2 gap-4">
            <Metric label="Available Balance" value={formatCurrency(financialSummary.availableBalance)} />
            <Metric label="Budget Balance" value={formatCurrency(financialSummary.budgetBalance)} />
            <Metric label="Flexible Balance" value={formatCurrency(financialSummary.flexibleBalance)} />
            <Metric label="Budget Status" value={riskLevelLabels[financialSummary.riskLevel] || financialSummary.riskLevel} />
          </div>
        </Section>

        {/* ── Latela Score ── */}
        <Section title="Latela Score">
          <p className="text-3xl font-bold">{financialSummary.totalScore}/100</p>
        </Section>

        {/* ── Balance Chart ── */}
        {balanceChartData.length > 0 && (
          <Section title="Balance Trend" pageBreak>
            <BarChart width={CHART_W} height={CHART_H} data={balanceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={10} />
              <YAxis fontSize={10} tickFormatter={(v: number) => `R${(v / 1000).toFixed(0)}k`} />
              <Legend fontSize={10} />
              <Bar dataKey="availableBalance" name="Available" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="savingsBalance" name="Savings" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </Section>
        )}

        {/* ── Spending Trend Chart ── */}
        {spendingChartData.length > 0 && (
          <Section title="Spending Trend">
            <BarChart width={CHART_W} height={CHART_H} data={spendingChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={10} />
              <YAxis fontSize={10} tickFormatter={(v: number) => `R${(v / 1000).toFixed(0)}k`} />
              <Bar dataKey="total" name="Total Spending" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </Section>
        )}

        {/* ── Budget Allocation Pie Chart ── */}
        {categoryBreakdown.length > 0 && (
          <Section title="Budget Allocation" pageBreak>
            <div className="flex gap-6 items-start">
              <PieChart width={280} height={280}>
                <Pie
                  data={categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ name, percent }: { name: string; percent: number }) =>
                    `${name.slice(0, 12)} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                  fontSize={9}
                >
                  {categoryBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color || SPENDING_COLORS[i % SPENDING_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
              <table className="text-xs flex-1">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-1 font-medium">Category</th>
                    <th className="text-right py-1 font-medium">Amount</th>
                    <th className="text-right py-1 font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakdown.map((cat, i) => {
                    const total = categoryBreakdown.reduce((s, c) => s + c.value, 0);
                    return (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-1 flex items-center gap-1">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color || SPENDING_COLORS[i % SPENDING_COLORS.length] }}
                          />
                          {cat.name}
                        </td>
                        <td className="py-1 text-right">{formatCurrency(cat.value)}</td>
                        <td className="py-1 text-right">{total > 0 ? ((cat.value / total) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* ── Budget Plan Table ── */}
        <Section title="Budget Plan" pageBreak>
          {budgetItems.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 font-medium">Item</th>
                  <th className="text-left py-2 font-medium">Frequency</th>
                  <th className="text-right py-2 font-medium">Amount</th>
                  <th className="text-right py-2 font-medium">Monthly</th>
                </tr>
              </thead>
              <tbody>
                {budgetItems.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">{item.frequency}</td>
                    <td className="py-2 text-right">{formatCurrency(item.amount)}</td>
                    <td className="py-2 text-right">{formatCurrency(item.monthlyAmount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-bold">
                  <td className="py-2" colSpan={3}>Total Monthly Budget</td>
                  <td className="py-2 text-right">{formatCurrency(totalMonthlyBudget)}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-sm text-gray-500">No budget items set up yet.</p>
          )}
        </Section>

        {/* ── Savings Goals Table ── */}
        <Section title="Savings Goals">
          {goals.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 font-medium">Goal</th>
                  <th className="text-right py-2 font-medium">Alloc/mo</th>
                  <th className="text-right py-2 font-medium">Saved</th>
                  <th className="text-right py-2 font-medium">Target</th>
                  <th className="text-left py-2 font-medium pl-3">Due</th>
                  <th className="text-right py-2 font-medium">Progress</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((goal, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2">{goal.name}</td>
                    <td className="py-2 text-right">{formatCurrency(goal.monthlyAllocation)}</td>
                    <td className="py-2 text-right">{formatCurrency(goal.amountSaved)}</td>
                    <td className="py-2 text-right">{formatCurrency(goal.target)}</td>
                    <td className="py-2 pl-3">{goal.timeline}</td>
                    <td className="py-2 text-right">{goal.progress}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-bold">
                  <td className="py-2">Total Monthly Savings</td>
                  <td className="py-2 text-right">{formatCurrency(totalMonthlySavings)}</td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-sm text-gray-500">No savings goals set up yet.</p>
          )}
        </Section>

        {/* ── Transaction History Table ── */}
        {transactions.length > 0 && (
          <Section title="Transaction History" pageBreak>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1 font-medium">Date</th>
                  <th className="text-left py-1 font-medium">Description</th>
                  <th className="text-left py-1 font-medium">Category</th>
                  <th className="text-right py-1 font-medium">Amount</th>
                  <th className="text-right py-1 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1">{tx.date}</td>
                    <td className="py-1 truncate max-w-[200px]">{tx.description}</td>
                    <td className="py-1">{tx.category}</td>
                    <td className={`py-1 text-right ${tx.amount < 0 ? "text-red-600" : "text-green-700"}`}>
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-1 text-right">{tx.balance != null ? formatCurrency(tx.balance) : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length >= 50 && (
              <p className="text-xs text-gray-400 mt-1">Showing most recent 50 transactions</p>
            )}
          </Section>
        )}

        {/* ── Footer ── */}
        <div className="border-t-2 border-black pt-4 text-center text-xs text-gray-500 mt-12">
          <p>Generated by Latela · {today}</p>
        </div>
      </div>
    );
  }
);

PrintableReport.displayName = "PrintableReport";

// ── Helper components ─────────────────────────────────

const Section = ({
  title,
  children,
  pageBreak,
}: {
  title: string;
  children: React.ReactNode;
  pageBreak?: boolean;
}) => (
  <section className={`mb-8 ${pageBreak ? "break-before-page" : ""}`}>
    <h2
      className="text-lg font-bold mb-3 border-b border-gray-300 pb-1"
      style={{ fontFamily: "'Cooper BT', serif" }}
    >
      {title}
    </h2>
    {children}
  </section>
);

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-sm text-gray-600">{label}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);
