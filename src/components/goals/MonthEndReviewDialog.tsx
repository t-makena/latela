import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, Calendar, TrendingDown } from "lucide-react";
import { useSavingsAdjustment, AdjustmentResult } from "@/hooks/useSavingsAdjustment";
import { useUserSettings, SavingsAdjustmentStrategy } from "@/hooks/useUserSettings";
import { useGoals } from "@/hooks/useGoals";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "@/components/ui/sonner";

const MONTH_END_REVIEW_KEY = 'lastMonthEndReview';

// Check if we're in the last 3 days of the month
const isNearMonthEnd = (): boolean => {
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  return currentDay >= lastDayOfMonth - 2;
};

// Get current month-year key for tracking reviews
const getCurrentMonthKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}`;
};

// Check if review was already done this month
const wasReviewedThisMonth = (): boolean => {
  const lastReview = localStorage.getItem(MONTH_END_REVIEW_KEY);
  return lastReview === getCurrentMonthKey();
};

// Mark review as done for this month
const markReviewDone = (): void => {
  localStorage.setItem(MONTH_END_REVIEW_KEY, getCurrentMonthKey());
};

export const MonthEndReviewDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const { savingsStatus } = useSavingsAdjustment();
  const { savingsAdjustmentStrategy } = useUserSettings();
  const { updateGoal, goals } = useGoals();
  const { t } = useLanguage();

  // Check for month-end and shortfall on mount and when status changes
  useEffect(() => {
    const shouldShowReview = 
      isNearMonthEnd() && 
      !wasReviewedThisMonth() && 
      savingsStatus.hasShortfall &&
      savingsStatus.adjustments.length > 0;

    if (shouldShowReview) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [savingsStatus.hasShortfall, savingsStatus.adjustments.length]);

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
    if (savingsStatus.adjustments.length === 0) return;

    setIsApplying(true);
    try {
      for (const adjustment of savingsStatus.adjustments) {
        const goal = goals.find(g => g.id === adjustment.goalId);
        if (!goal) continue;

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

      markReviewDone();
      toast.success(t('goals.adjustmentsApplied') || 'Adjustments applied successfully!');
      setIsOpen(false);
    } catch (error) {
      console.error('Error applying adjustments:', error);
      toast.error(t('common.error') || 'Failed to apply adjustments');
    } finally {
      setIsApplying(false);
    }
  };

  const handleDismiss = () => {
    markReviewDone();
    setIsOpen(false);
  };

  const handleRemindLater = () => {
    setIsOpen(false);
    // Don't mark as reviewed - will show again on next page load
  };

  const daysUntilMonthEnd = (): number => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return lastDay - now.getDate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t('goals.monthEndReview') || 'Month-End Savings Review'}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 pt-2">
            <Calendar className="h-4 w-4" />
            {daysUntilMonthEnd() === 0 
              ? (t('goals.lastDayOfMonth') || "It's the last day of the month!")
              : `${daysUntilMonthEnd()} ${t('goals.daysUntilMonthEnd') || 'days until month end'}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Balance Summary */}
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t('goals.expectedBalance') || 'Expected Balance'}
              </span>
              <span className="font-medium">{formatCurrency(savingsStatus.expectedBalance)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t('finance.availableBalance') || 'Available Balance'}
              </span>
              <span className="font-medium">{formatCurrency(savingsStatus.availableBalance)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-destructive/30 pt-2">
              <span className="text-sm font-medium text-destructive">
                {t('goals.shortfall') || 'Shortfall'}
              </span>
              <span className="font-bold text-destructive">
                {formatCurrency(savingsStatus.shortfall)}
              </span>
            </div>
          </div>

          {/* Strategy Info */}
          <p className="text-sm text-muted-foreground">
            {t('goals.adjustmentExplanation') || 'Based on your savings strategy'} (
            <span className="font-medium">{getStrategyLabel(savingsAdjustmentStrategy)}</span>
            ), {t('goals.hereAreRecommendedAdjustments') || "here are the recommended adjustments:"}
          </p>

          {/* Adjustment Preview */}
          {savingsStatus.adjustments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <TrendingDown className="h-4 w-4" />
                {t('goals.adjustmentPreview') || 'Adjustment Preview'}
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savingsStatus.adjustments.map((adj) => (
                  <div 
                    key={adj.goalId} 
                    className="text-sm flex items-center justify-between bg-muted/50 p-3 rounded-lg"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{adj.goalName}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <span>{formatCurrency(adj.currentAllocation)}/mo</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="text-destructive font-medium">
                          {formatCurrency(adj.newAllocation)}/mo
                        </span>
                      </div>
                    </div>
                    {adj.timelineExtensionMonths > 0 && adj.timelineExtensionMonths !== Infinity && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                        +{adj.timelineExtensionMonths}mo
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleRemindLater} className="sm:order-1">
            {t('common.remindLater') || 'Remind Later'}
          </Button>
          <Button variant="ghost" onClick={handleDismiss} className="sm:order-2">
            {t('common.dismiss') || 'Dismiss'}
          </Button>
          <Button 
            onClick={handleApplyAdjustments} 
            disabled={isApplying}
            variant="destructive"
            className="sm:order-3"
          >
            {isApplying 
              ? (t('common.saving') || 'Applying...') 
              : (t('goals.applyAdjustments') || 'Apply Adjustments')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
