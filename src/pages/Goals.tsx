import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target, Edit2, Plus, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useGoals } from "@/hooks/useGoals";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddGoalDialog } from "@/components/goals/AddGoalDialog";

const Goals = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Monthly savings state with localStorage persistence
  const [monthlySavings, setMonthlySavings] = useState<number>(() => {
    const saved = localStorage.getItem('monthlySavings');
    return saved ? parseFloat(saved) : 0;
  });

  const { goals, loading, error, addGoal, deleteGoal } = useGoals(monthlySavings);
  
  // Separate goals for the two sections
  const budgetGoals = goals.slice(0, 3);
  const goalsOverview = goals;
  
  // Calculate total amount saved
  const totalAmountSaved = goals.reduce((total, goal) => total + goal.amountSaved, 0);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const handleMonthlySavingsChange = (value: number) => {
    const sanitizedValue = isNaN(value) ? 0 : value;
    setMonthlySavings(sanitizedValue);
    localStorage.setItem('monthlySavings', sanitizedValue.toString());
  };

  const handleDeleteGoal = async (goalId: string, goalName: string) => {
    if (!confirm(`Are you sure you want to delete the goal "${goalName}"?`)) {
      return;
    }

    try {
      await deleteGoal(goalId);
      toast.success("Goal deleted successfully!");
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal. Please try again.");
    }
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium font-georama">{goal.name}</h3>
                    {goal.isComplete && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{goal.progress}% Saved</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${goal.isComplete ? 'bg-green-500' : 'bg-foreground'}`}
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
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
            {/* Monthly Savings and Total Amount Saved */}
            <div className="flex justify-between items-start gap-4">
              {/* Monthly Savings Input - Left */}
              <div className="flex-1">
                <Label htmlFor="monthly-savings-mobile" className="text-sm text-muted-foreground mb-1 block">
                  Monthly Savings
                </Label>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold">R</span>
                  <Input
                    id="monthly-savings-mobile"
                    type="number"
                    value={monthlySavings || ''}
                    onChange={(e) => handleMonthlySavingsChange(parseFloat(e.target.value))}
                    placeholder="0"
                    className="text-xl font-bold font-georama w-28 h-10"
                    min="0"
                  />
                </div>
              </div>
              
              {/* Total Amount Saved - Right */}
              <div className="flex-1 text-right">
                <p className="text-sm text-muted-foreground mb-1">Total Amount Saved</p>
                <p className="text-2xl font-bold font-georama">{formatCurrency(totalAmountSaved)}</p>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium w-[18%] px-2">Goal</TableHead>
                  <TableHead className="font-medium w-[14%] px-2">
                    Priority<sup>1</sup>
                  </TableHead>
                  <TableHead className="font-medium w-[16%] px-2">
                    Allocation<sup>2</sup>
                  </TableHead>
                  <TableHead className="font-medium text-right w-[18%] px-2">
                    Saved (R)<sup>3</sup>
                  </TableHead>
                  <TableHead className="font-medium w-[16%] px-2">
                    Timeline<sup>4</sup>
                  </TableHead>
                  <TableHead className="w-[8%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goalsOverview.length > 0 ? (
                  goalsOverview.map((row) => (
                    <TableRow key={row.id} className={row.isComplete ? 'opacity-60' : ''}>
                      <TableCell className="font-medium px-2 py-4">
                        <div className="flex items-center gap-1">
                          {row.isComplete && <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />}
                          <span className={row.isComplete ? 'line-through' : ''}>{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-4">{row.priority}</TableCell>
                      <TableCell className="px-2 py-4 font-medium">{formatCurrency(row.monthlyAllocation)}</TableCell>
                      <TableCell className="text-right font-medium px-2 py-4">{formatCurrency(row.amountSaved)}</TableCell>
                      <TableCell className="px-2 py-4">{row.timeline}</TableCell>
                      <TableCell className="px-2 py-4">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteGoal(row.id, row.name)}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          title="Delete goal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
              <p>1. Priority shows the % of your monthly savings allocated to each goal using deadline-weighted formula (Target ÷ MonthsLeft²).</p>
              <p>2. Allocation shows the Rand amount to save this month for each goal based on your monthly savings and priority.</p>
              <p>3. Saved shows the actual rand value saved for each goal so far.</p>
              <p>4. Timeline indicates your target deadline for each goal.</p>
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
            {/* Monthly Savings and Total Amount Saved */}
            <div className="flex justify-between items-start gap-8">
              {/* Monthly Savings Input - Left */}
              <div className="flex-1">
                <Label htmlFor="monthly-savings" className="text-sm text-muted-foreground mb-1 block">
                  Monthly Savings
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">R</span>
                  <Input
                    id="monthly-savings"
                    type="number"
                    value={monthlySavings || ''}
                    onChange={(e) => handleMonthlySavingsChange(parseFloat(e.target.value))}
                    placeholder="0"
                    className="text-2xl font-bold font-georama w-40 h-12"
                    min="0"
                  />
                </div>
              </div>
              
              {/* Total Amount Saved - Right */}
              <div className="flex-1 text-right">
                <p className="text-sm text-muted-foreground mb-1">Total Amount Saved</p>
                <p className="text-3xl font-bold font-georama">{formatCurrency(totalAmountSaved)}</p>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium w-[18%] px-6">Goal</TableHead>
                  <TableHead className="font-medium w-[12%] px-6">
                    Priority<sup>1</sup>
                  </TableHead>
                  <TableHead className="font-medium w-[14%] px-6">
                    Allocation<sup>2</sup>
                  </TableHead>
                  <TableHead className="font-medium text-right w-[16%] px-6">
                    Saved (R)<sup>3</sup>
                  </TableHead>
                  <TableHead className="font-medium w-[14%] px-6">
                    Timeline<sup>4</sup>
                  </TableHead>
                  <TableHead className="font-medium w-[12%] px-6">
                    Months Left
                  </TableHead>
                  <TableHead className="w-[8%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goalsOverview.length > 0 ? (
                  goalsOverview.map((row) => (
                    <TableRow key={row.id} className={row.isComplete ? 'opacity-60 bg-muted/30' : ''}>
                      <TableCell className="font-medium px-6 py-4">
                        <div className="flex items-center gap-2">
                          {row.isComplete && <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />}
                          <span className={row.isComplete ? 'line-through' : ''}>{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">{row.priority}</TableCell>
                      <TableCell className="px-6 py-4 font-medium text-primary">{formatCurrency(row.monthlyAllocation)}</TableCell>
                      <TableCell className="text-right font-medium px-6 py-4">{formatCurrency(row.amountSaved)}</TableCell>
                      <TableCell className="px-6 py-4">{row.timeline}</TableCell>
                      <TableCell className="px-6 py-4">{row.isComplete ? '—' : row.monthsLeft}</TableCell>
                      <TableCell className="px-6 py-4">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteGoal(row.id, row.name)}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          title="Delete goal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
              <p>1. Priority shows the % of your monthly savings allocated to each goal using deadline-weighted formula (Target ÷ MonthsLeft²).</p>
              <p>2. Allocation shows the Rand amount to save this month for each goal based on your monthly savings and priority.</p>
              <p>3. Saved shows the actual rand value saved for each goal so far.</p>
              <p>4. Timeline indicates your target deadline for each goal.</p>
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
