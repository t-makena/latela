import { forwardRef } from "react";
import { formatCurrency } from "@/lib/realData";
import latelaLogo from "@/assets/latela-logo.png";

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

interface PrintableReportProps {
  userName: string;
  financialSummary: FinancialSummary;
  budgetItems: BudgetItemRow[];
  goals: GoalRow[];
  totalMonthlyBudget: number;
  totalMonthlySavings: number;
}

const riskLevelLabels: Record<string, string> = {
  safe: "Safe",
  mild: "Mild Risk",
  moderate: "Moderate Risk",
  high: "High Risk",
  critical: "Critical",
};

export const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(
  ({ userName, financialSummary, budgetItems, goals, totalMonthlyBudget, totalMonthlySavings }, ref) => {
    const today = new Date().toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    return (
      <div ref={ref} className="printable-report hidden print:block bg-white text-black p-8 max-w-[800px] mx-auto">
        {/* Header */}
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

        {/* Financial Overview */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1" style={{ fontFamily: "'Cooper BT', serif" }}>
            Financial Overview
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Available Balance</p>
              <p className="text-xl font-bold">{formatCurrency(financialSummary.availableBalance)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Budget Balance</p>
              <p className="text-xl font-bold">{formatCurrency(financialSummary.budgetBalance)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Flexible Balance</p>
              <p className="text-xl font-bold">{formatCurrency(financialSummary.flexibleBalance)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Budget Status</p>
              <p className="text-xl font-bold">{riskLevelLabels[financialSummary.riskLevel] || financialSummary.riskLevel}</p>
            </div>
          </div>
        </section>

        {/* Latela Score */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1" style={{ fontFamily: "'Cooper BT', serif" }}>
            Latela Score
          </h2>
          <p className="text-3xl font-bold">{financialSummary.totalScore}/100</p>
        </section>

        {/* Budget Plan */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1" style={{ fontFamily: "'Cooper BT', serif" }}>
            Budget Plan
          </h2>
          {budgetItems.length > 0 ? (
            <>
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
            </>
          ) : (
            <p className="text-sm text-gray-500">No budget items set up yet.</p>
          )}
        </section>

        {/* Savings Goals */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1" style={{ fontFamily: "'Cooper BT', serif" }}>
            Savings Goals
          </h2>
          {goals.length > 0 ? (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 font-medium">Goal</th>
                    <th className="text-right py-2 font-medium">Allocation/mo</th>
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
            </>
          ) : (
            <p className="text-sm text-gray-500">No savings goals set up yet.</p>
          )}
        </section>

        {/* Footer */}
        <div className="border-t-2 border-black pt-4 text-center text-xs text-gray-500 mt-12">
          <p>Generated by Latela · {today}</p>
        </div>
      </div>
    );
  }
);

PrintableReport.displayName = "PrintableReport";
