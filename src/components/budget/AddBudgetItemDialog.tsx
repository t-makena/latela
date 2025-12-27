import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle } from 'lucide-react';
import { useSubcategories, Subcategory } from '@/hooks/useSubcategories';
import { 
  BudgetCategory, 
  PARENT_TO_BUDGET_CATEGORY, 
  BUDGET_CATEGORY_LABELS 
} from '@/lib/categoryMapping';
import { CategoryAllocations, BudgetMethod } from '@/hooks/useBudgetMethod';

interface AddBudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, frequency: string, amount: number, daysPerWeek?: number, parentCategoryId?: string) => void;
  budgetMethod?: BudgetMethod;
  categoryAllocations?: CategoryAllocations;
  availableBalance?: number;
}

const FREQUENCIES = ['Monthly', 'Weekly', 'Bi-weekly', 'Daily', 'Once-off'];

// Calculate monthly equivalent for an amount based on frequency
const calculateMonthlyEquivalent = (
  amount: number, 
  frequency: string, 
  daysPerWeek?: number
): number => {
  switch (frequency) {
    case 'Daily':
      return amount * (daysPerWeek || 7) * 4.33;
    case 'Weekly':
      return amount * 4.33;
    case 'Bi-weekly':
      return amount * 2.17;
    case 'Once-off':
      return amount;
    case 'Monthly':
    default:
      return amount;
  }
};

export const AddBudgetItemDialog = ({
  open,
  onOpenChange,
  onAdd,
  budgetMethod = 'zero_based',
  categoryAllocations,
  availableBalance = 0,
}: AddBudgetItemDialogProps) => {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('Monthly');
  const [amount, setAmount] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState('7');
  const [useCustomName, setUseCustomName] = useState(false);
  
  // Fetch all subcategories with custom replacements applied
  const { subcategories, loading: categoriesLoading } = useSubcategories();

  // Find the selected subcategory and its budget category
  const selectedSubcategory = useMemo(() => {
    if (useCustomName || !name) return null;
    return subcategories.find(cat => cat.name === name) || null;
  }, [subcategories, name, useCustomName]);

  const budgetCategory = useMemo((): BudgetCategory | null => {
    if (!selectedSubcategory?.parent_category_id) return null;
    return PARENT_TO_BUDGET_CATEGORY[selectedSubcategory.parent_category_id] || null;
  }, [selectedSubcategory]);

  // Calculate validation info for percentage-based budgeting
  const validationInfo = useMemo(() => {
    if (budgetMethod !== 'percentage_based' || !categoryAllocations || !budgetCategory || budgetCategory === 'income') {
      return null;
    }

    const allocation = categoryAllocations[budgetCategory];
    if (!allocation) return null;

    const numericAmount = parseFloat(amount) || 0;
    const numericDaysPerWeek = frequency === 'Daily' ? parseInt(daysPerWeek) || 7 : undefined;
    const monthlyAmount = calculateMonthlyEquivalent(numericAmount, frequency, numericDaysPerWeek);

    const newTotal = allocation.allocated + monthlyAmount;
    const wouldExceed = newTotal > allocation.limit;
    const excessAmount = wouldExceed ? newTotal - allocation.limit : 0;
    const usagePercent = allocation.limit > 0 ? Math.min((allocation.allocated / allocation.limit) * 100, 100) : 0;
    const projectedUsagePercent = allocation.limit > 0 ? Math.min((newTotal / allocation.limit) * 100, 100) : 0;

    return {
      categoryLabel: BUDGET_CATEGORY_LABELS[budgetCategory],
      limit: allocation.limit,
      allocated: allocation.allocated,
      remaining: allocation.remaining,
      percentage: allocation.percentage,
      monthlyAmount,
      newTotal,
      wouldExceed,
      excessAmount,
      usagePercent,
      projectedUsagePercent,
    };
  }, [budgetMethod, categoryAllocations, budgetCategory, amount, frequency, daysPerWeek]);

  const formatCurrency = (value: number) => {
    return `R${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !amount) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    const numericDaysPerWeek = frequency === 'Daily' ? parseInt(daysPerWeek) : undefined;
    const parentCategoryId = selectedSubcategory?.parent_category_id;

    onAdd(name, frequency, numericAmount, numericDaysPerWeek, parentCategoryId);
    
    // Reset form
    setName('');
    setFrequency('Monthly');
    setAmount('');
    setDaysPerWeek('7');
    setUseCustomName(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Budget Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-type">Category Type</Label>
              <Select
                value={useCustomName ? 'custom' : 'category'}
                onValueChange={(value) => {
                  setUseCustomName(value === 'custom');
                  setName('');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="custom">Custom Merchant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">
                {useCustomName ? 'Merchant Name' : 'Category'}
              </Label>
              {useCustomName ? (
                <Input
                  id="name"
                  placeholder="Enter merchant name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              ) : (
                <Select value={name} onValueChange={setName} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : (
                      subcategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Category Limit Info - Only show for percentage-based budgeting with valid category */}
            {validationInfo && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-foreground">
                    {validationInfo.categoryLabel} Budget ({validationInfo.percentage}%)
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(validationInfo.limit)}
                  </span>
                </div>
                
                <Progress 
                  value={validationInfo.projectedUsagePercent} 
                  className={`h-2 ${validationInfo.wouldExceed ? '[&>div]:bg-destructive' : '[&>div]:bg-primary'}`}
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Allocated: {formatCurrency(validationInfo.allocated)}</span>
                  <span>Remaining: {formatCurrency(Math.max(0, validationInfo.remaining))}</span>
                </div>

                {validationInfo.monthlyAmount > 0 && (
                  <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                    This item: {formatCurrency(validationInfo.monthlyAmount)}/month
                  </div>
                )}

                {validationInfo.wouldExceed && (
                  <div className="flex items-start gap-2 p-2 rounded bg-destructive/10 border border-destructive/20 mt-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="text-xs text-destructive">
                      <p className="font-medium">Exceeds {validationInfo.categoryLabel} limit</p>
                      <p>This would exceed your limit by {formatCurrency(validationInfo.excessAmount)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {freq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {frequency === 'Daily' && (
              <div className="grid gap-2">
                <Label htmlFor="daysPerWeek">Days per Week</Label>
                <Input
                  id="daysPerWeek"
                  type="number"
                  min="1"
                  max="7"
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (R)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit"
              variant={validationInfo?.wouldExceed ? 'destructive' : 'default'}
            >
              {validationInfo?.wouldExceed ? 'Add Anyway' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};