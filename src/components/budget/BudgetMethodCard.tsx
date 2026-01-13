import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BudgetMethod } from '@/hooks/useBudgetMethod';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface BudgetMethodCardProps {
  budgetMethod: BudgetMethod;
  needsPercentage: number;
  wantsPercentage: number;
  savingsPercentage: number;
  loading: boolean;
  onUpdateBudgetMethod: (method: BudgetMethod) => Promise<boolean>;
  onUpdatePercentages: (needs: number, wants: number, savings: number) => Promise<boolean>;
}

export const BudgetMethodCard = ({
  budgetMethod,
  needsPercentage,
  wantsPercentage,
  savingsPercentage,
  loading,
  onUpdateBudgetMethod,
  onUpdatePercentages,
}: BudgetMethodCardProps) => {
  const { t } = useLanguage();

  // Local state for unsaved changes
  const [localNeeds, setLocalNeeds] = useState<number>(needsPercentage);
  const [localWants, setLocalWants] = useState<number>(wantsPercentage);
  const [localSavings, setLocalSavings] = useState<number>(savingsPercentage);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when database values change
  useEffect(() => {
    setLocalNeeds(needsPercentage);
    setLocalWants(wantsPercentage);
    setLocalSavings(savingsPercentage);
  }, [needsPercentage, wantsPercentage, savingsPercentage]);

  const total = Math.round((localNeeds + localWants + localSavings) * 100) / 100;
  const isValidTotal = Math.abs(total - 100) < 0.01;
  const hasChanges = localNeeds !== needsPercentage || 
                     localWants !== wantsPercentage || 
                     localSavings !== savingsPercentage;

  const handleMethodChange = async (value: string) => {
    try {
      await onUpdateBudgetMethod(value as BudgetMethod);
      toast.success('Budget method updated');
    } catch (err) {
      toast.error('Failed to update budget method');
    }
  };

  const handleSavePercentages = async () => {
    if (!isValidTotal) {
      toast.error('Total must equal 100%');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdatePercentages(localNeeds, localWants, localSavings);
      toast.success('Budget percentages updated');
    } catch (err) {
      toast.error('Failed to update percentages');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetChanges = () => {
    setLocalNeeds(needsPercentage);
    setLocalWants(wantsPercentage);
    setLocalSavings(savingsPercentage);
  };

  if (loading) {
    return (
      <Card className="w-full bg-card border border-foreground">
        <CardHeader>
          <CardTitle className="heading-main">Budget Method</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-card border border-foreground transition-all duration-300 ease-out">
      <CardHeader>
        <CardTitle className="heading-main">Budget Method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={budgetMethod}
          onValueChange={handleMethodChange}
          className="space-y-4"
        >
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="zero_based" id="zero_based" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="zero_based" className="font-medium cursor-pointer">
                Zero-based
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Every rand must be allocated to a task using the budget planner. Excess income will be automatically added to savings.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="percentage_based" id="percentage_based" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="percentage_based" className="font-medium cursor-pointer">
                Percentage-based
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Allocate a percentage of your income to each category - Needs, Wants, Savings.
              </p>
            </div>
          </div>
        </RadioGroup>

        {budgetMethod === 'percentage_based' && (
          <div className="pt-4 border-t border-border animate-slide-down overflow-hidden">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <span className="text-sm font-medium">Category</span>
              <span className="text-sm font-medium text-right">%</span>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 items-center">
                <Label className="text-sm">Needs</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={localNeeds}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setLocalNeeds(isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
                    }}
                    className="h-9 text-right pr-7"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center">
                <Label className="text-sm">Wants</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={localWants}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setLocalWants(isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
                    }}
                    className="h-9 text-right pr-7"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center">
                <Label className="text-sm">Savings</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={localSavings}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setLocalSavings(isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
                    }}
                    className="h-9 text-right pr-7"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center pt-2 border-t border-border">
                <span className="text-sm font-bold">Total</span>
                <span className={cn(
                  "text-sm font-bold text-right",
                  isValidTotal ? "text-green-600" : "text-destructive"
                )}>
                  {total}%
                </span>
              </div>

              {!isValidTotal && hasChanges && (
                <p className="text-xs text-destructive">
                  Total must equal 100% to save changes
                </p>
              )}

              {hasChanges && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetChanges}
                    className="flex-1"
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSavePercentages}
                    disabled={!isValidTotal || isSaving}
                    className="flex-1"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
