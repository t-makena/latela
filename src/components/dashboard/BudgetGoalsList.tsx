import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAccounts } from "@/hooks/useAccounts";
import { useGoals } from "@/hooks/useGoals";
import { Skeleton } from "@/components/ui/skeleton";

export const BudgetGoalsList = () => {
  const isMobile = useIsMobile();
  const { accounts } = useAccounts();
  const { goals, loading } = useGoals();
  
  // Show as many goals as there are accounts, minimum 1
  const numberOfGoalsToShow = Math.max(accounts.length, 1);
  const displayedGoals = goals.slice(0, numberOfGoalsToShow);

  if (loading) {
    const content = (
      <>
        <div className="pb-2">
          <div className={isMobile ? "text-base font-medium" : "text-lg font-bold"}>Budget Goals</div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </>
    );

    return isMobile ? (
      <div className="mb-4">{content}</div>
    ) : (
      <Card className="stat-card" style={{ boxShadow: '4px 4px 0px #000000' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">Budget Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (goals.length === 0) {
    const emptyContent = (
      <>
        <div className="pb-2">
          <div className={isMobile ? "text-base font-medium" : "text-lg font-bold"}>Budget Goals</div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground text-center py-4">
            No goals yet. Create your first goal!
          </p>
        </div>
      </>
    );

    return isMobile ? (
      <div className="mb-4">{emptyContent}</div>
    ) : (
      <Card className="stat-card" style={{ boxShadow: '4px 4px 0px #000000' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">Budget Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No goals yet. Create your first goal!
          </p>
        </CardContent>
      </Card>
    );
  }

  const goalsContent = (
    <div className="space-y-4">
      {displayedGoals.map((goal) => {
        const percentage = goal.progress;
        
        return (
          <div key={goal.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{goal.name}</h3>
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
    </div>
  );

  return isMobile ? (
    <div className="mb-4">
      <div className="pb-2 mb-3">
        <div className="text-base font-medium">Budget Goals</div>
      </div>
      {goalsContent}
    </div>
  ) : (
    <Card className="stat-card" style={{ boxShadow: '4px 4px 0px #000000' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">Budget Goals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goalsContent}
      </CardContent>
    </Card>
  );
};
