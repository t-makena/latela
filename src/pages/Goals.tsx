import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, Trash2, CheckCircle2, Pencil } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useGoals } from "@/hooks/useGoals";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddGoalDialog } from "@/components/goals/AddGoalDialog";
import { useIncomeSettings } from "@/hooks/useIncomeSettings";
import { useLanguage } from "@/hooks/useLanguage";
import { GoalsSavingsBalanceChart } from "@/components/goals/GoalsSavingsBalanceChart";
import { MonthEndReviewDialog } from "@/components/goals/MonthEndReviewDialog";

interface GoalToEdit {
  id: string;
  name: string;
  target: number;
  amountSaved: number;
  monthlyAllocation: number;
  timeline: string;
}

const Goals = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<GoalToEdit | null>(null);
  const isMobile = useIsMobile();
  const { frequency, getFrequencyLabel, getPeriodTerm } = useIncomeSettings();
  const { t } = useLanguage();

  const { goals, loading, error, addGoal, updateGoal, deleteGoal } = useGoals();
  
  // Get target saving label based on frequency
  const getTargetSavingLabel = () => {
    switch (frequency) {
      case 'weekly': return 'Target Weekly Saving';
      case 'bi-weekly': return 'Target Bi-weekly Saving';
      default: return 'Target Monthly Saving';
    }
  };
  
  // Get allocation footnote based on frequency
  const getAllocationFootnote = () => {
    switch (frequency) {
      case 'weekly': return 'Allocation shows the Rand amount to save this week for each goal.';
      case 'bi-weekly': return 'Allocation shows the Rand amount to save this pay period for each goal.';
      default: return 'Allocation shows the Rand amount to save this month for each goal.';
    }
  };
  
  // Separate goals for the two sections
  const budgetGoals = goals.slice(0, 3);
  const goalsOverview = goals;
  
  // Calculate total amount saved
  const totalAmountSaved = goals.reduce((total, goal) => total + goal.amountSaved, 0);
  
  // Calculate total monthly allocation (sum of all goals' monthly allocations)
  const totalMonthlyAllocation = goals.reduce((total, goal) => total + goal.monthlyAllocation, 0);
  
  // Calculate total target savings
  const totalTargetSavings = goals.reduce((total, goal) => total + goal.target, 0);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
      toast.success("Goal deleted successfully!");
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal. Please try again.");
    }
  };

  const handleEditGoal = (goal: GoalToEdit) => {
    setGoalToEdit(goal);
    setDialogOpen(true);
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
    <div className="space-y-6 relative z-10 pt-6 px-6">
      {/* Month-End Review Dialog */}
      <MonthEndReviewDialog />
      
      {/* Budget Goals Section */}
      <Card className="bg-card border border-border w-full">
        <CardHeader className="pb-4">
          <CardTitle className="heading-main">{t('goals.budgetGoals')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {budgetGoals.length > 0 ? (
            budgetGoals.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="table-body-text font-medium">{goal.name}</h3>
                    {goal.isComplete && (
                      <CheckCircle2 className="h-4 w-4 text-positive" />
                    )}
                  </div>
                  <span className="label-text">{goal.progress}% Saved</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${goal.isComplete ? 'bg-green-500' : 'bg-foreground'}`}
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
                <p className="transaction-date">{goal.dueDate}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">{t('goals.noGoalsYet')}</p>
          )}
        </CardContent>
      </Card>

      {/* Combined Savings Balance Chart with Status */}
      <GoalsSavingsBalanceChart />

      {/* Goals Overview Table */}
      {isMobile ? (
        <div 
          className="bg-card rounded-3xl border border-border p-5 w-full"
        >
          <div className="pb-2 mb-2">
            <h2 className="heading-main">{t('goals.goalsOverview')}</h2>
          </div>
          <div className="space-y-6">
            {/* Target Saving and Total Amount Saved */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <p className="label-text mb-1">{t('goals.targetMonthlySaving')}</p>
                <p className="heading-main currency">{formatCurrency(totalMonthlyAllocation)}</p>
              </div>
              <div className="flex-1 text-center">
                <p className="label-text mb-1">{t('goals.totalAmountSaved')}</p>
                <p className="heading-main currency">{formatCurrency(totalAmountSaved)}</p>
              </div>
              <div className="flex-1 text-right">
                <p className="label-text mb-1">Target Total Savings</p>
                <p className="heading-main currency">{formatCurrency(totalTargetSavings)}</p>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="table-header-text w-[22%] px-2">{t('goals.goal')}</TableHead>
                  <TableHead className="table-header-text w-[18%] px-2">
                    {t('goals.allocation')}<sup>1</sup>
                  </TableHead>
                  <TableHead className="table-header-text text-right w-[18%] px-2">
                    {t('goals.saved')} (R)<sup>2</sup>
                  </TableHead>
                  <TableHead className="table-header-text w-[18%] px-2">
                    {t('goals.target')}<sup>3</sup>
                  </TableHead>
                  <TableHead className="table-header-text w-[18%] px-2">
                    {t('goals.timeline')}<sup>4</sup>
                  </TableHead>
                  <TableHead className="w-[6%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goalsOverview.length > 0 ? (
                  goalsOverview.map((row) => (
                    <TableRow key={row.id} className={row.isComplete ? 'opacity-60' : ''}>
                      <TableCell className="table-body-text font-medium px-2 py-4">
                        <div className="flex items-center gap-1">
                          {row.isComplete && <CheckCircle2 className="h-3 w-3 text-positive flex-shrink-0" />}
                          <span className={row.isComplete ? 'line-through' : ''}>{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-4 table-body-text font-medium currency">{formatCurrency(row.monthlyAllocation)}</TableCell>
                      <TableCell className="text-right table-body-text font-medium px-2 py-4 currency">{formatCurrency(row.amountSaved)}</TableCell>
                      <TableCell className="px-2 py-4 table-body-text currency">{formatCurrency(row.target)}</TableCell>
                      <TableCell className="px-2 py-4 table-body-text">{row.timeline}</TableCell>
                      <TableCell className="px-2 py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditGoal({
                              id: row.id,
                              name: row.name,
                              target: row.target,
                              amountSaved: row.amountSaved,
                              monthlyAllocation: row.monthlyAllocation,
                              timeline: row.timeline,
                            })}
                            className="h-8 w-8 hover:bg-muted"
                            title="Edit goal"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteGoal(row.id)}
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            title="Delete goal"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
              <p className="text-sm text-muted-foreground">{t('goals.addNewGoal')}</p>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground pt-4 border-t">
              <p>1. {getAllocationFootnote()}</p>
              <p>2. Saved shows the actual rand value saved for each goal so far.</p>
              <p>3. Target shows the total amount you want to save for each goal.</p>
              <p>4. Timeline indicates your target deadline for each goal.</p>
            </div>
          </div>
        </div>
      ) : (
        <Card className="bg-card border border-border w-full">
          <CardHeader className="pb-4">
            <CardTitle className="heading-main">{t('goals.goalsOverview')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Target Saving and Total Amount Saved */}
            <div className="flex justify-between items-start gap-8">
              <div className="flex-1">
                <p className="label-text mb-1">{t('goals.targetMonthlySaving')}</p>
                <p className="heading-main currency">{formatCurrency(totalMonthlyAllocation)}</p>
              </div>
              <div className="flex-1 text-center">
                <p className="label-text mb-1">{t('goals.totalAmountSaved')}</p>
                <p className="heading-main currency">{formatCurrency(totalAmountSaved)}</p>
              </div>
              <div className="flex-1 text-right">
                <p className="label-text mb-1">Target Total Savings</p>
                <p className="heading-main currency">{formatCurrency(totalTargetSavings)}</p>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="table-header-text w-[22%] px-6">{t('goals.goal')}</TableHead>
                  <TableHead className="table-header-text w-[16%] px-6">
                    {t('goals.allocation')}<sup>1</sup>
                  </TableHead>
                  <TableHead className="table-header-text text-right w-[16%] px-6">
                    {t('goals.saved')} (R)<sup>2</sup>
                  </TableHead>
                  <TableHead className="table-header-text w-[16%] px-6">
                    {t('goals.target')}<sup>3</sup>
                  </TableHead>
                  <TableHead className="table-header-text w-[16%] px-6">
                    {t('goals.timeline')}<sup>4</sup>
                  </TableHead>
                  <TableHead className="w-[8%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goalsOverview.length > 0 ? (
                  goalsOverview.map((row) => (
                    <TableRow key={row.id} className={row.isComplete ? 'opacity-60 bg-muted/30' : ''}>
                      <TableCell className="table-body-text font-medium px-6 py-4">
                        <div className="flex items-center gap-2">
                          {row.isComplete && <CheckCircle2 className="h-4 w-4 text-positive flex-shrink-0" />}
                          <span className={row.isComplete ? 'line-through' : ''}>{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 table-body-text font-medium text-primary currency">{formatCurrency(row.monthlyAllocation)}</TableCell>
                      <TableCell className="text-right table-body-text font-medium px-6 py-4 currency">{formatCurrency(row.amountSaved)}</TableCell>
                      <TableCell className="px-6 py-4 table-body-text currency">{formatCurrency(row.target)}</TableCell>
                      <TableCell className="px-6 py-4 table-body-text">{row.timeline}</TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditGoal({
                              id: row.id,
                              name: row.name,
                              target: row.target,
                              amountSaved: row.amountSaved,
                              monthlyAllocation: row.monthlyAllocation,
                              timeline: row.timeline,
                            })}
                            className="h-8 w-8 hover:bg-muted"
                            title="Edit goal"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteGoal(row.id)}
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            title="Delete goal"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
              <p className="text-sm text-muted-foreground">{t('goals.addNewGoal')}</p>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground pt-4 border-t">
              <p>1. {getAllocationFootnote()}</p>
              <p>2. Saved shows the actual rand value saved for each goal so far.</p>
              <p>3. Target shows the total amount you want to save for each goal.</p>
              <p>4. Timeline indicates your target deadline for each goal.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <AddGoalDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setGoalToEdit(null);
        }}
        onAdd={addGoal}
        onEdit={async (id, data) => {
          await updateGoal(id, {
            name: data.name!,
            target: data.target!,
            currentSaved: data.currentSaved,
            monthlyAllocation: data.monthlyAllocation,
            dueDate: data.dueDate!,
          });
          toast.success("Goal updated successfully!");
        }}
        goalToEdit={goalToEdit}
      />
    </div>
  );
};

export default Goals;
