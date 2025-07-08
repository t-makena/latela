
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAIInsights } from "@/lib/data";
import { Lightbulb } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export const AIInsights = () => {
  const insights = getAIInsights();
  const isMobile = useIsMobile();

  return (
    <Card className="mt-6 border-t-4 border-t-primary">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="text-primary" size={18} />
          <span className="text-lg font-georama font-medium">Financial Insights</span>
        </CardTitle>
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
