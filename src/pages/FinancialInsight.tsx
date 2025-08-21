import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FinancialInsight = () => {
  return (
    <div className="space-y-2 relative z-10">
      <Card>
        <CardHeader>
          <CardTitle className="font-georama">Financial Insights</CardTitle>
          <p className="text-sm text-muted-foreground">Analyze your spending patterns and financial health</p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Financial insights coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialInsight;