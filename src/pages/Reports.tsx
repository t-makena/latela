import { useRef, useState } from "react";
import { FileText, Download, Table2, Sheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgetItems } from "@/hooks/useBudgetItems";
import { useGoals } from "@/hooks/useGoals";
import { useAccounts } from "@/hooks/useAccounts";
import { useBudgetScore } from "@/hooks/useBudgetScore";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useBudgetMethod } from "@/hooks/useBudgetMethod";
import { PrintableReport } from "@/components/reports/PrintableReport";
import {
  downloadCSV,
  downloadExcel,
  openInGoogleSheets,
  formatTransactionsForExport,
  formatBudgetItemsForExport,
  formatGoalsForExport,
} from "@/lib/exportUtils";
import { toast } from "@/components/ui/sonner";

type TimePeriod = "1M" | "3M" | "6M" | "1Y" | "All";

const Reports = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const [txPeriod, setTxPeriod] = useState<TimePeriod>("All");

  // Data hooks
  const { transactions } = useTransactions({ currentMonthOnly: false, limit: 10000 });
  const { budgetItems, calculateMonthlyAmount, calculateTotalMonthly } = useBudgetItems();
  const { goals } = useGoals();
  const { accounts } = useAccounts();
  const { totalScore, riskLevel } = useBudgetScore();
  const { getDisplayName } = useUserProfile();
  const now = new Date();
  const { events } = useCalendarEvents({ year: now.getFullYear(), month: now.getMonth() + 1 });

  // Compute financial summary
  const availableBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalMonthlyBudget = calculateTotalMonthly();
  const upcomingEventsTotal = (events || [])
    .filter(e => !e.isCompleted)
    .reduce((sum, e) => sum + (e.budgetedAmount || 0), 0);
  const budgetBalance = totalMonthlyBudget + upcomingEventsTotal;
  const totalMonthlySavings = goals.reduce((sum, g) => sum + g.monthlyAllocation, 0);
  const flexibleBalance = availableBalance - totalMonthlySavings - budgetBalance;

  // Filter transactions by period
  const filteredTransactions = (() => {
    if (txPeriod === "All") return transactions;
    const now = new Date();
    const months = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 }[txPeriod];
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
    return transactions.filter(t => new Date(t.transaction_date) >= cutoff);
  })();

  // Prepared export data
  const budgetItemRows = budgetItems.map(item => ({
    name: item.name,
    frequency: item.frequency,
    amount: item.amount,
    monthlyAmount: calculateMonthlyAmount(item),
  }));

  const goalRows = goals.map(g => ({
    name: g.name,
    monthlyAllocation: g.monthlyAllocation,
    amountSaved: g.amountSaved,
    target: g.target,
    timeline: g.timeline,
    progress: g.progress,
  }));

  const handlePrintPDF = () => {
    window.print();
    toast.success("PDF report ready — use your browser's Save as PDF option");
  };

  const handleExport = (
    type: "csv" | "excel" | "sheets",
    dataset: "transactions" | "budget" | "goals"
  ) => {
    let data: Record<string, unknown>[] = [];
    let filename = "latela";

    switch (dataset) {
      case "transactions":
        data = formatTransactionsForExport(filteredTransactions);
        filename = `latela-transactions-${txPeriod.toLowerCase()}`;
        break;
      case "budget":
        data = formatBudgetItemsForExport(budgetItems, calculateMonthlyAmount);
        filename = "latela-budget-items";
        break;
      case "goals":
        data = formatGoalsForExport(goals);
        filename = "latela-savings-goals";
        break;
    }

    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    switch (type) {
      case "csv":
        downloadCSV(data, filename);
        toast.success("CSV downloaded");
        break;
      case "excel":
        downloadExcel(data, filename);
        toast.success("Excel file downloaded");
        break;
      case "sheets":
        openInGoogleSheets(data);
        toast.success("CSV downloaded — import it into the Google Sheet that opened");
        break;
    }
  };

  const periods: TimePeriod[] = ["1M", "3M", "6M", "1Y", "All"];

  return (
    <>
      <div className="space-y-6 pb-8 print:hidden">
        <div>
          <h1 className="heading-main">Reports</h1>
          <p className="label-text mt-1">Download reports and export your financial data</p>
        </div>

        {/* PDF Report Section */}
        <Card>
          <CardHeader>
            <CardTitle className="heading-card flex items-center gap-2">
              <FileText size={22} />
              Full Financial Report
            </CardTitle>
            <CardDescription>
              Download a complete PDF report with your financial overview, budget plan, savings goals, and Latela Score.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handlePrintPDF} className="gap-2">
              <Download size={16} />
              Download PDF Report
            </Button>
          </CardContent>
        </Card>

        {/* Spreadsheet Exports */}
        <div>
          <h2 className="heading-card mb-4">Spreadsheet Exports</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Transactions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Table2 size={18} />
                  Transactions
                </CardTitle>
                <CardDescription className="text-xs">
                  {filteredTransactions.length} transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Period filter */}
                <div className="flex gap-1 flex-wrap">
                  {periods.map(p => (
                    <Button
                      key={p}
                      variant={txPeriod === p ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => setTxPeriod(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
                <ExportButtons onExport={type => handleExport(type, "transactions")} />
              </CardContent>
            </Card>

            {/* Budget Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Table2 size={18} />
                  Budget Items
                </CardTitle>
                <CardDescription className="text-xs">
                  {budgetItems.length} items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExportButtons onExport={type => handleExport(type, "budget")} />
              </CardContent>
            </Card>

            {/* Goals */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Table2 size={18} />
                  Savings Goals
                </CardTitle>
                <CardDescription className="text-xs">
                  {goals.length} goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExportButtons onExport={type => handleExport(type, "goals")} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Hidden printable report */}
      <PrintableReport
        ref={printRef}
        userName={getDisplayName() || "User"}
        financialSummary={{
          availableBalance,
          budgetBalance,
          flexibleBalance,
          totalScore,
          riskLevel,
        }}
        budgetItems={budgetItemRows}
        goals={goalRows}
        totalMonthlyBudget={totalMonthlyBudget}
        totalMonthlySavings={totalMonthlySavings}
      />
    </>
  );
};

/** Reusable export button group */
const ExportButtons = ({ onExport }: { onExport: (type: "csv" | "excel" | "sheets") => void }) => (
  <div className="flex gap-2 flex-wrap">
    <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => onExport("csv")}>
      <Download size={14} />
      CSV
    </Button>
    <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => onExport("excel")}>
      <Download size={14} />
      Excel
    </Button>
    <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => onExport("sheets")}>
      <Sheet size={14} />
      Sheets
    </Button>
  </div>
);

export default Reports;
