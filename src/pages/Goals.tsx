import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit } from "lucide-react";

const Goals = () => {
  const goals = [
    {
      id: 1,
      name: "Emergency fund",
      progress: 50,
      targetAmount: 10000,
      currentAmount: 5000,
      dueDate: "Due 1st Aug 25"
    }
  ];

  const insights = [
    "Due to your spending over the past month, you will need to increase your savings amount for the upcoming month to reach your 'FIFA World Cup trip' goal. Increase your savings by R150 to meet this target or adjust your priority settings.",
    "You are on track to completing your 'Emergency savings' goal. A reward is in the other side!"
  ];

  return (
    <div className="space-y-6 relative z-10">
      {/* Goals Overview */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-georama text-xl">Goals Overview</CardTitle>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="space-y-3 p-4 rounded-lg border bg-muted/20">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-medium font-georama">{goal.name}</h3>
                  <p className="text-sm text-muted-foreground">{goal.dueDate}</p>
                </div>
                <span className="text-sm font-medium">{goal.progress}% saved</span>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </div>
          ))}
          
          <Button 
            variant="outline" 
            className="w-full mt-4 flex items-center gap-2 border-dashed"
          >
            <Plus className="h-4 w-4" />
            Add new goal
          </Button>
        </CardContent>
      </Card>

      {/* Goal Insights */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-georama text-xl">Goal Insight</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Goals;