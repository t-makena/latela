import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useBudgetMethod, BudgetMethod } from '@/hooks/useBudgetMethod';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

// 0-100 in 5% increments
const PERCENTAGE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

export const BudgetMethodCard = () => {
  const { t } = useLanguage();
  const {
    budgetMethod,
    needsPercentage,
    wantsPercentage,
    savingsPercentage,
    loading,
    updateBudgetMethod,
    updatePercentages,
  } = useBudgetMethod();

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

  const total = localNeeds + localWants + localSavings;
  const isValidTotal = total === 100;
  const hasChanges = localNeeds !== needsPercentage || 
                     localWants !== wantsPercentage || 
                     localSavings !== savingsPercentage;

  const handleMethodChange = async (value: string) => {
    try {
      await updateBudgetMethod(value as BudgetMethod);
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
      await updatePercentages(localNeeds, localWants, localSavings);
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
    <Card className="w-full bg-card border border-foreground">
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
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <span className="text-sm font-medium">Category</span>
              <span className="text-sm font-medium text-right">%</span>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 items-center">
                <Label className="text-sm">Needs</Label>
                <Select
                  value={localNeeds.toString()}
                  onValueChange={(v) => setLocalNeeds(parseInt(v))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERCENTAGE_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p.toString()}>
                        {p}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center">
                <Label className="text-sm">Wants</Label>
                <Select
                  value={localWants.toString()}
                  onValueChange={(v) => setLocalWants(parseInt(v))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERCENTAGE_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p.toString()}>
                        {p}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center">
                <Label className="text-sm">Savings</Label>
                <Select
                  value={localSavings.toString()}
                  onValueChange={(v) => setLocalSavings(parseInt(v))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERCENTAGE_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p.toString()}>
                        {p}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
