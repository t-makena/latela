import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics } from "@/lib/realData";

export const AIInsights = () => {
  const { transactions } = useTransactions();
  const { monthlyExpenses, monthlySavings, netBalance } = calculateFinancialMetrics(transactions);
  const isMobile = useIsMobile();
  
  // Generate insights based on real data
  const insights = [
    `Your monthly expenses are ${monthlyExpenses > 0 ? 'R' + monthlyExpenses.toLocaleString() : 'being calculated'}.`,
    `Net balance this month: ${netBalance > 0 ? '+' : ''}R${netBalance.toLocaleString()}.`,
    monthlySavings > 0 ? `Great job saving R${monthlySavings.toLocaleString()} this month!` : "Consider setting up automatic savings transfers."
  ];

  const content = (
    <ul className="space-y-3">
      {insights.map((insight, index) => (
        <li key={index} className="flex gap-2 text-sm">
          <span className="text-primary font-bold">•</span>
          <span>{insight}</span>
        </li>
      ))}
    </ul>
  );

  return isMobile ? (
    <div className="mt-4 border-t-2 border-t-primary pt-3">
      <div className="pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="text-primary" size={16} />
          <span className="text-base font-georama font-medium">Financial Insights</span>
        </div>
      </div>
      {content}
    </div>
  ) : (
    <Card className="mt-6 border-t-4 border-t-primary">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="text-primary" size={18} />
          <span className="text-lg font-georama font-medium">Financial Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};