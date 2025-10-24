import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAccounts } from "@/hooks/useAccounts";
import { useGoals } from "@/hooks/useGoals";
import { Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export const BudgetGoalsList = () => {
  const isMobile = useIsMobile();
  const { accounts } = useAccounts();
  const { goals, loading } = useGoals();
  
  // Show as many goals as there are accounts, minimum 1
  const numberOfGoalsToShow = Math.max(accounts.length, 1);
  const displayedGoals = goals.slice(0, numberOfGoalsToShow);

  if (loading) {
    return (
      <Card className="stat-card">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-georama font-medium">Budget Goals</CardTitle>
            <Link to="/goals">
              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                <Target className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (goals.length === 0) {
    return (
      <Card className="stat-card">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-georama font-medium">Budget Goals</CardTitle>
            <Link to="/goals">
              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                <Target className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No goals yet. Create your first goal!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="stat-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-georama font-medium">Budget Goals</CardTitle>
          <Link to="/goals">
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <Target className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedGoals.map((goal) => {
          const percentage = goal.progress;
          
          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium font-georama">{goal.name}</h3>
                <span className="text-sm text-muted-foreground">
                  {percentage}% saved
                </span>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-value bg-black"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              
              <div className="text-xs text-muted-foreground">
                Due: {goal.timeline}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
