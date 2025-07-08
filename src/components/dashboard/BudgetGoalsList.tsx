
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { budgetGoals, formatCurrency, formatDate } from "@/lib/data";
import { toast } from "@/components/ui/sonner";

export const BudgetGoalsList = () => {
  const [goals, setGoals] = useState(budgetGoals);
  
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    category: 'Savings',
    endDate: ''
  });
  
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleAddGoal = () => {
    if (!newGoal.name || newGoal.targetAmount <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    const colors = ['#000000', '#333333', '#666666', '#999999', '#cccccc'];
    const newGoalItem = {
      id: (goals.length + 1).toString(),
      name: newGoal.name,
      targetAmount: newGoal.targetAmount,
      currentAmount: newGoal.currentAmount,
      category: newGoal.category,
      endDate: newGoal.endDate || null,
      color: colors[goals.length % colors.length]
    };

    setGoals(prev => [...prev, newGoalItem]);
    setNewGoal({
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      category: 'Savings',
      endDate: ''
    });
    setShowAddDialog(false);
    toast.success("Goal added successfully!");
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="font-georama">Budget Goals</CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus size={16} />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-georama">Add New Budget Goal</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="goalName">Goal Name</Label>
                  <Input 
                    id="goalName" 
                    value={newGoal.name} 
                    onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                    placeholder="e.g., Vacation Fund"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="targetAmount">Target Amount</Label>
                  <Input 
                    id="targetAmount" 
                    type="number" 
                    value={newGoal.targetAmount || ''} 
                    onChange={(e) => setNewGoal({
                      ...newGoal, 
                      targetAmount: parseFloat(e.target.value) || 0
                    })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currentAmount">Current Amount (Optional)</Label>
                  <Input 
                    id="currentAmount" 
                    type="number" 
                    value={newGoal.currentAmount || ''} 
                    onChange={(e) => setNewGoal({
                      ...newGoal, 
                      currentAmount: parseFloat(e.target.value) || 0
                    })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    value={newGoal.endDate} 
                    onChange={(e) => setNewGoal({...newGoal, endDate: e.target.value})}
                  />
                </div>
                <Button onClick={handleAddGoal} className="mt-2">
                  Add Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {goals.map((goal) => {
            const percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium font-georama">{goal.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {percentage}%
                      {goal.endDate && ` • Due ${formatDate(goal.endDate)}`}
                    </p>
                  </div>
                </div>
                
                <div className="progress-bar">
                  <div 
                    className="progress-value"
                    style={{ 
                      width: `${Math.min(100, percentage)}%`,
                      backgroundColor: '#000000'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
