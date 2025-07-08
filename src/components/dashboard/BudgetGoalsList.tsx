
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { budgetGoals } from "@/lib/data";
import { useIsMobile } from "@/hooks/use-mobile";

export const BudgetGoalsList = () => {
  const goals = budgetGoals;
  const isMobile = useIsMobile();

  return (
    <Card className="stat-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-georama font-medium">Budget Goals</CardTitle>
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
