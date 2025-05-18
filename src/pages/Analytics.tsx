
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { monthlySpending } from "@/lib/data";

const Analytics = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Visualize your financial data and identify trends
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingChart type="bar" />
            <div className="mt-6 grid grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Highest Month</p>
                <p className="text-xl font-bold">
                  {monthlySpending.reduce((max, curr) => curr.amount > max.amount ? curr : max, monthlySpending[0]).month}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Lowest Month</p>
                <p className="text-xl font-bold">
                  {monthlySpending.reduce((min, curr) => curr.amount < min.amount ? curr : min, monthlySpending[0]).month}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Average</p>
                <p className="text-xl font-bold">
                  ${(monthlySpending.reduce((sum, curr) => sum + curr.amount, 0) / monthlySpending.length).toFixed(2)}
                </p>
              </Card>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingChart type="pie" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
