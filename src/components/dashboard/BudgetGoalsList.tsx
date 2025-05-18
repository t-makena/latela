
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { budgetGoals, formatCurrency } from "@/lib/data";
import { toast } from "@/components/ui/sonner";

export const BudgetGoalsList = () => {
  const [goals, setGoals] = useState(budgetGoals);
  const [editingGoal, setEditingGoal] = useState<null | {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
  }>(null);
  
  const handleUpdateGoal = () => {
    if (!editingGoal) return;
    
    setGoals(prev => prev.map(goal => 
      goal.id === editingGoal.id 
        ? { ...goal, ...editingGoal }
        : goal
    ));
    
    toast.success("Goal updated successfully!");
    setEditingGoal(null);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Budget Goals</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus size={16} />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Budget Goal</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Form would be implemented here for new goals */}
                <p className="text-muted-foreground text-sm">
                  Feature coming soon: Create new budget goals!
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {goals.map((goal) => (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{goal.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                    {goal.endDate && ` • Due ${new Date(goal.endDate).toLocaleDateString()}`}
                  </p>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditingGoal({
                        id: goal.id,
                        name: goal.name,
                        targetAmount: goal.targetAmount,
                        currentAmount: goal.currentAmount,
                      })}
                    >
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Goal</DialogTitle>
                    </DialogHeader>
                    {editingGoal && (
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Goal Name</Label>
                          <Input 
                            id="name" 
                            value={editingGoal.name} 
                            onChange={(e) => setEditingGoal({...editingGoal, name: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="target">Target Amount</Label>
                          <Input 
                            id="target" 
                            type="number" 
                            value={editingGoal.targetAmount} 
                            onChange={(e) => setEditingGoal({
                              ...editingGoal, 
                              targetAmount: parseFloat(e.target.value) || 0
                            })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="current">Current Amount</Label>
                          <Input 
                            id="current" 
                            type="number" 
                            value={editingGoal.currentAmount} 
                            onChange={(e) => setEditingGoal({
                              ...editingGoal, 
                              currentAmount: parseFloat(e.target.value) || 0
                            })}
                          />
                        </div>
                        <Button onClick={handleUpdateGoal} className="mt-2">
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-value"
                  style={{ 
                    width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%`,
                    backgroundColor: goal.color 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
