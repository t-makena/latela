
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAIInsights } from "@/lib/data";
import { Lightbulb } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export const AIInsights = () => {
  const insights = getAIInsights();
  const isMobile = useIsMobile();

  const Container = isMobile ? 'div' : Card;
  const Header = isMobile ? 'div' : CardHeader;
  const Content = isMobile ? 'div' : CardContent;

  return (
    <Container className={isMobile ? "border border-black p-4 bg-white border-t-4 border-t-primary" : "mt-6 border-t-4 border-t-primary"}>
      <Header className="pb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="text-primary" size={18} />
          <h2 className="text-lg font-georama font-medium">Financial Insights</h2>
        </div>
      </Header>
      <Content>
        <ul className="space-y-3">
          {insights.map((insight, index) => (
            <li key={index} className="flex gap-2 text-sm">
              <span className="text-primary font-bold">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </Content>
    </Container>
  );
};
