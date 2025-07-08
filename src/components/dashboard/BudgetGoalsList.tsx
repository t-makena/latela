
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBudgetGoals } from "@/lib/data";
import { useIsMobile } from "@/hooks/use-mobile";

export const BudgetGoalsList = () => {
  const goals = getBudgetGoals();
  const isMobile = useIsMobile();

  const Container = isMobile ? 'div' : Card;
  const Header = isMobile ? 'div' : CardHeader;
  const Content = isMobile ? 'div' : CardContent;

  return (
    <Container className={isMobile ? "border border-black p-4 bg-white" : "stat-card"}>
      <Header className="pb-2">
        <h2 className="text-lg font-georama font-medium">Budget Goals</h2>
      </Header>
      <Content className="space-y-4">
        {goals.map((goal, index) => {
          const percentage = (goal.current / goal.target) * 100;
          
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
                Due: {goal.dueDate}
              </div>
            </div>
          );
        })}
      </Content>
    </Container>
  );
};
