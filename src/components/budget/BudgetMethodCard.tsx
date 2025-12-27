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
import { useBudgetMethod, BudgetMethod } from '@/hooks/useBudgetMethod';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';

const PERCENTAGE_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80];

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

  const handleMethodChange = async (value: string) => {
    try {
      await updateBudgetMethod(value as BudgetMethod);
      toast.success('Budget method updated');
    } catch (err) {
      toast.error('Failed to update budget method');
    }
  };

  const handlePercentageChange = async (
    category: 'needs' | 'wants' | 'savings',
    value: number
  ) => {
    let newNeeds = needsPercentage;
    let newWants = wantsPercentage;
    let newSavings = savingsPercentage;

    if (category === 'needs') {
      newNeeds = value;
      // Adjust wants and savings proportionally to maintain 100%
      const remaining = 100 - value;
      const currentOtherTotal = wantsPercentage + savingsPercentage;
      if (currentOtherTotal > 0) {
        newWants = Math.round((wantsPercentage / currentOtherTotal) * remaining);
        newSavings = remaining - newWants;
      } else {
        newWants = Math.round(remaining * 0.6);
        newSavings = remaining - newWants;
      }
    } else if (category === 'wants') {
      newWants = value;
      const remaining = 100 - value;
      const currentOtherTotal = needsPercentage + savingsPercentage;
      if (currentOtherTotal > 0) {
        newNeeds = Math.round((needsPercentage / currentOtherTotal) * remaining);
        newSavings = remaining - newNeeds;
      } else {
        newNeeds = Math.round(remaining * 0.7);
        newSavings = remaining - newNeeds;
      }
    } else {
      newSavings = value;
      const remaining = 100 - value;
      const currentOtherTotal = needsPercentage + wantsPercentage;
      if (currentOtherTotal > 0) {
        newNeeds = Math.round((needsPercentage / currentOtherTotal) * remaining);
        newWants = remaining - newNeeds;
      } else {
        newNeeds = Math.round(remaining * 0.6);
        newWants = remaining - newNeeds;
      }
    }

    // Ensure we hit exactly 100%
    const total = newNeeds + newWants + newSavings;
    if (total !== 100) {
      newSavings += (100 - total);
    }

    try {
      await updatePercentages(newNeeds, newWants, newSavings);
      toast.success('Budget percentages updated');
    } catch (err) {
      toast.error('Failed to update percentages');
    }
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
                  value={needsPercentage.toString()}
                  onValueChange={(v) => handlePercentageChange('needs', parseInt(v))}
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
                  value={wantsPercentage.toString()}
                  onValueChange={(v) => handlePercentageChange('wants', parseInt(v))}
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
                  value={savingsPercentage.toString()}
                  onValueChange={(v) => handlePercentageChange('savings', parseInt(v))}
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
                <span className="text-sm font-bold text-right">
                  {needsPercentage + wantsPercentage + savingsPercentage}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
