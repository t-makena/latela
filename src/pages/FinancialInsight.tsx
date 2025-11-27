import { FinancialInsightContent } from "@/components/financial-insight/FinancialInsightContent";

const FinancialInsight = () => {
  return (
    <div className="min-h-screen bg-background px-6 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Financial Insight</h1>
        <p className="text-sm text-muted-foreground">All Accounts</p>
      </div>
      
      <FinancialInsightContent />
    </div>
  );
};

export default FinancialInsight;