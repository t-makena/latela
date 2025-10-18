import { Skeleton } from "@/components/ui/skeleton";

interface BudgetInsightsProps {
  isLoading?: boolean;
}

export const BudgetInsights = ({ isLoading = false }: BudgetInsightsProps) => {
  // Placeholder insights - can be replaced with AI-generated insights later
  const bulletPoints = [
    "Your spending has decreased by 12% compared to last month",
    "You're on track to meet your savings goal for this month"
  ];

  const numberedInsights = [
    "Consider reducing dining out expenses to save an additional R500 this month",
    "Your grocery spending is 15% below budget - great job staying on track!"
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">•</span>
            <Skeleton className="h-2.5 flex-1 max-w-[200px]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">•</span>
            <Skeleton className="h-2.5 flex-1 max-w-[280px]" />
          </div>
        </div>
        
        <div className="border-b border-foreground/20" />
        
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-sm">1.</span>
            <Skeleton className="h-2.5 flex-1 max-w-[220px]" />
          </div>
          <div className="flex items-start gap-2">
            <span className="text-sm">2.</span>
            <Skeleton className="h-2.5 flex-1 max-w-[320px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {bulletPoints.map((point, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-sm mt-0.5">•</span>
            <p className="text-sm">{point}</p>
          </div>
        ))}
      </div>
      
      <div className="border-b border-foreground/20" />
      
      <div className="space-y-2">
        {numberedInsights.map((insight, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-sm mt-0.5">{index + 1}.</span>
            <p className="text-sm">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
