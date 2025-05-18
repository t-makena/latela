
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAIInsights } from "@/lib/data";
import { Lightbulb } from "lucide-react";

export const AIInsights = () => {
  const insights = getAIInsights();

  return (
    <Card className="mt-6 border-t-4 border-t-primary">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="text-primary" size={18} />
          <CardTitle>AI Financial Insights</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {insights.map((insight, index) => (
            <li key={index} className="flex gap-2 text-sm">
              <span className="text-primary font-bold">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
