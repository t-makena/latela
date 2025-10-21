import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target, Edit2, Plus } from "lucide-react";

const Goals = () => {
  const budgetGoals = [
    { name: "Emergency Fund", progress: 87, dueDate: "Due: 02 Oct '25" },
    { name: "MacBook", progress: 57, dueDate: "Due: 24 Dec '25" },
    { name: "December Holiday", progress: 64, dueDate: "Due: 10 Dec '25" }
  ];

  const goalsOverview = [
    { goal: "Emergency fund", priority: "37.60%", split: "60%", amountSaved: 18800, timeline: "02 Oct 25" },
    { goal: "MacBook", priority: "24.30%", split: "20.5%", amountSaved: 11400, timeline: "24 Dec 25" },
    { goal: "Dec Holiday", priority: "10.10%", split: "15%", amountSaved: 9600, timeline: "10 Dec 25" },
    { goal: "Extra savings", priority: "18.00%", split: "4.5%", amountSaved: 5430, timeline: "n/a" }
  ];
  
  // Calculate total amount saved
  const totalAmountSaved = goalsOverview.reduce((total, goal) => total + goal.amountSaved, 0);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6 relative z-10">
      {/* Budget Goals Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <CardTitle className="font-georama text-xl">Budget Goals</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {budgetGoals.map((goal, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium font-georama">{goal.name}</h3>
                <span className="text-sm text-muted-foreground">{goal.progress}% Saved</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-foreground transition-all"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{goal.dueDate}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Goals Overview Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            <CardTitle className="font-georama text-xl">Goals Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Amount Saved Summary */}
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Amount Saved</p>
            <p className="text-3xl font-bold font-georama">{formatCurrency(totalAmountSaved)}</p>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium w-[28%] px-6">Goal</TableHead>
                <TableHead className="font-medium w-[14%] px-6">
                  Priority<sup>1</sup>
                </TableHead>
                <TableHead className="font-medium w-[12%] px-6 pr-1">
                  Split<sup>2</sup>
                </TableHead>
                <TableHead className="font-medium text-right w-[24%] pl-1 pr-6">
                  Amount Saved (R)<sup>3</sup>
                </TableHead>
                <TableHead className="font-medium w-[22%] px-6">
                  Timeline<sup>4</sup>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goalsOverview.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium px-6 py-4">{row.goal}</TableCell>
                  <TableCell className="px-6 py-4">{row.priority}</TableCell>
                  <TableCell className="px-6 py-4 pr-1">{row.split}</TableCell>
                  <TableCell className="text-right font-medium pl-1 pr-6 py-4">{formatCurrency(row.amountSaved)}</TableCell>
                  <TableCell className="px-6 py-4">{row.timeline}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col items-center gap-2 pt-4">
            <Button 
              variant="outline" 
              size="icon"
              className="h-10 w-10 rounded-full border-2"
            >
              <Plus className="h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground">Add a new goal</p>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground pt-4 border-t">
            <p>1. Priority shows the % of your upcoming monthly savings to be allocated to each goal.</p>
            <p>2. Split reflects the share each goal has of your current total savings.</p>
            <p>3. Amount Saved shows the actual rand value saved for each goal.</p>
            <p>4. Dates indicate your target deadline and/or the estimated completion date based on the priority and split of the goal.</p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Goals;