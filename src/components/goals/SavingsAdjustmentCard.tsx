import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, ArrowRight, TrendingDown } from "lucide-react";
import { useSavingsAdjustment } from "@/hooks/useSavingsAdjustment";
import { useUserSettings, SavingsAdjustmentStrategy } from "@/hooks/useUserSettings";
import { useGoals } from "@/hooks/useGoals";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "@/components/ui/sonner";
import { useState } from "react";

interface SavingsAdjustmentCardProps {
  compact?: boolean;
}

export const SavingsAdjustmentCard = ({ compact = false }: SavingsAdjustmentCardProps) => {
  const { savingsStatus } = useSavingsAdjustment();
  const { savingsAdjustmentStrategy } = useUserSettings();
  const { updateGoal, goals } = useGoals();
  const { t } = useLanguage();
  const [isApplying, setIsApplying] = useState(false);
  
  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };
  
  const getStrategyLabel = (strategy: SavingsAdjustmentStrategy) => {
    switch (strategy) {
      case 'inverse_priority':
        return t('settings.inversePriority') || 'Prioritize important goals';
      case 'proportional':
        return t('settings.proportional') || 'Reduce proportionally';
      case 'even_distribution':
        return t('settings.evenDistribution') || 'Reduce equally';
    }
  };
  
  const handleApplyAdjustments = async () => {
    if (!savingsStatus.hasShortfall || savingsStatus.adjustments.length === 0) return;
    
    setIsApplying(true);
    try {
      for (const adjustment of savingsStatus.adjustments) {
        const goal = goals.find(g => g.id === adjustment.goalId);
        if (!goal) continue;
        
        // Parse timeline to get due date
        const dueDateParts = goal.timeline.split(' ');
        const dueDate = new Date();
        if (adjustment.timelineExtensionMonths > 0 && adjustment.timelineExtensionMonths !== Infinity) {
          dueDate.setMonth(dueDate.getMonth() + adjustment.timelineExtensionMonths);
        }
        
        await updateGoal(adjustment.goalId, {
          name: goal.name,
          target: goal.target,
          currentSaved: goal.amountSaved,
          monthlyAllocation: adjustment.newAllocation,
          dueDate: dueDate,
        });
      }
      
      toast.success(t('goals.adjustmentsApplied') || 'Adjustments applied successfully!');
    } catch (error) {
      console.error('Error applying adjustments:', error);
      toast.error(t('common.error') || 'Failed to apply adjustments');
    } finally {
      setIsApplying(false);
    }
  };
  
  // No shortfall - show success state
  if (!savingsStatus.hasShortfall) {
    return (
      <Card className="bg-card border border-border w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            {t('goals.savingsStatus') || 'Savings Status'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('goals.expectedBalance') || 'Expected Balance'}</span>
              <span className="font-medium">{formatCurrency(savingsStatus.expectedBalance)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('finance.availableBalance') || 'Available Balance'}</span>
              <span className="font-medium text-green-600">{formatCurrency(savingsStatus.availableBalance)}</span>
            </div>
            <p className="text-sm text-green-600 pt-2">
              {t('finance.onTrack') || "You're on track with your savings goals!"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Has shortfall - show warning and adjustments
  return (
    <Card className="bg-card border border-destructive/50 w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          {t('goals.savingsStatus') || 'Savings Status'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Balance Summary */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('goals.expectedBalance') || 'Expected Balance'}</span>
              <span className="font-medium">{formatCurrency(savingsStatus.expectedBalance)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('finance.availableBalance') || 'Available Balance'}</span>
              <span className="font-medium">{formatCurrency(savingsStatus.availableBalance)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-destructive font-medium">{t('goals.shortfall') || 'Shortfall'}</span>
              <span className="font-bold text-destructive">{formatCurrency(savingsStatus.shortfall)}</span>
            </div>
          </div>
          
          {/* Strategy Info */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            {t('goals.usingStrategy') || 'Strategy'}: <span className="font-medium">{getStrategyLabel(savingsAdjustmentStrategy)}</span>
          </div>
          
          {/* Adjustment Preview */}
          {!compact && savingsStatus.adjustments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <TrendingDown className="h-4 w-4" />
                {t('goals.adjustmentPreview') || 'Adjustment Preview'}
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {savingsStatus.adjustments.map((adj) => (
                  <div key={adj.goalId} className="text-sm flex items-center justify-between bg-muted/30 p-2 rounded">
                    <div className="flex-1">
                      <span className="font-medium">{adj.goalName}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{formatCurrency(adj.currentAllocation)}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="text-destructive">{formatCurrency(adj.newAllocation)}</span>
                        <span className="ml-2">(-{formatCurrency(adj.reduction)})</span>
                      </div>
                    </div>
                    {adj.timelineExtensionMonths > 0 && adj.timelineExtensionMonths !== Infinity && (
                      <span className="text-xs text-muted-foreground">
                        +{adj.timelineExtensionMonths} {t('budget.monthly') || 'months'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Apply Button */}
          <Button 
            onClick={handleApplyAdjustments}
            disabled={isApplying}
            className="w-full"
            variant="destructive"
          >
            {isApplying 
              ? (t('common.saving') || 'Applying...') 
              : (t('goals.applyAdjustments') || 'Apply Adjustments')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
