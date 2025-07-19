
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { budgetGoals } from "@/lib/data";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus } from "lucide-react";

export const BudgetGoalsList = () => {
  const goals = budgetGoals;
  const isMobile = useIsMobile();

  return (
    <Card className="stat-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-georama font-medium">Budget Goals</CardTitle>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal, index) => {
          const percentage = (goal.currentAmount / goal.targetAmount) * 100;
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium font-georama">{goal.category}</h3>
                <span className="text-sm text-muted-foreground">
                  {Math.round(percentage)}% saved
                </span>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-value bg-black"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              
              <div className="text-xs text-muted-foreground">
                Due: {goal.endDate}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
