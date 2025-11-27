import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target, Edit2, Plus, Loader2 } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddGoalDialog } from "@/components/goals/AddGoalDialog";

const Goals = () => {
  const { goals, loading, error, addGoal } = useGoals();
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Separate goals for the two sections
  const budgetGoals = goals.slice(0, 3);
  const goalsOverview = goals;
  
  // Calculate total amount saved
  const totalAmountSaved = goals.reduce((total, goal) => total + goal.amountSaved, 0);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Error loading goals: {error}</AlertDescription>
      </Alert>
    );
  }

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
          {budgetGoals.length > 0 ? (
            budgetGoals.map((goal) => (
              <div key={goal.id} className="space-y-2">
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
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No goals yet. Add your first goal below!</p>
          )}
        </CardContent>
      </Card>

      {/* Goals Overview Table */}
      {isMobile ? (
        <div className="-mx-3">
          <div className="pb-2 mb-2 px-3">
            <div className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              <h2 className="font-georama text-xl font-semibold">Goals Overview</h2>
            </div>
          </div>
          <div className="space-y-6 px-3">
            {/* Total Amount Saved Summary */}
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Amount Saved</p>
              <p className="text-3xl font-bold font-georama">{formatCurrency(totalAmountSaved)}</p>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium w-[28%] px-2">Goal</TableHead>
                  <TableHead className="font-medium w-[14%] px-2">
                    Priority<sup>1</sup>
                  </TableHead>
                  <TableHead className="font-medium w-[12%] px-2 pr-1">
                    Split<sup>2</sup>
                  </TableHead>
                  <TableHead className="font-medium text-right w-[24%] pl-1 pr-2">
                    Amount Saved (R)<sup>3</sup>
                  </TableHead>
                  <TableHead className="font-medium w-[22%] px-2">
                    Timeline<sup>4</sup>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goalsOverview.length > 0 ? (
                  goalsOverview.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium px-2 py-4">{row.name}</TableCell>
                      <TableCell className="px-2 py-4">{row.priority}</TableCell>
                      <TableCell className="px-2 py-4 pr-1">{row.split}</TableCell>
                      <TableCell className="text-right font-medium pl-1 pr-2 py-4">{formatCurrency(row.amountSaved)}</TableCell>
                      <TableCell className="px-2 py-4">{row.timeline}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No goals found. Click below to add your first goal.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex flex-col items-center gap-2 pt-4">
              <Button 
                variant="outline" 
                size="icon"
                className="h-10 w-10 rounded-full border-2"
                onClick={() => setDialogOpen(true)}
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
          </div>
        </div>
      ) : (
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
                {goalsOverview.length > 0 ? (
                  goalsOverview.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium px-6 py-4">{row.name}</TableCell>
                      <TableCell className="px-6 py-4">{row.priority}</TableCell>
                      <TableCell className="px-6 py-4 pr-1">{row.split}</TableCell>
                      <TableCell className="text-right font-medium pl-1 pr-6 py-4">{formatCurrency(row.amountSaved)}</TableCell>
                      <TableCell className="px-6 py-4">{row.timeline}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No goals found. Click below to add your first goal.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex flex-col items-center gap-2 pt-4">
              <Button 
                variant="outline" 
                size="icon"
                className="h-10 w-10 rounded-full border-2"
                onClick={() => setDialogOpen(true)}
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
      )}

      <AddGoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={addGoal}
      />
    </div>
  );
};

export default Goals;