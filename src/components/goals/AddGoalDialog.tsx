import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { goalSchema } from '@/lib/validationSchemas';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Calculator } from 'lucide-react';
import { format, addMonths, differenceInMonths, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type GoalFormData = z.infer<typeof goalSchema>;

type CalculationMode = 'allocation' | 'date';

interface GoalToEdit {
  id: string;
  name: string;
  target: number;
  amountSaved: number;
  monthlyAllocation: number;
  timeline: string;
}

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: GoalFormData) => Promise<void>;
  onEdit?: (id: string, data: GoalFormData) => Promise<void>;
  goalToEdit?: GoalToEdit | null;
}

export const AddGoalDialog = ({ open, onOpenChange, onAdd, onEdit, goalToEdit }: AddGoalDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculationMode, setCalculationMode] = useState<CalculationMode>('allocation');
  const [calculationMessage, setCalculationMessage] = useState<string>('');
  const isEditMode = !!goalToEdit;

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      target: undefined,
      currentSaved: undefined,
      monthlyAllocation: undefined,
      dueDate: undefined,
    },
  });

  // Watch form values for calculations
  const target = form.watch('target');
  const currentSaved = form.watch('currentSaved') || 0;
  const monthlyAllocation = form.watch('monthlyAllocation');
  const dueDate = form.watch('dueDate');

  // Calculate remaining amount
  const remainingAmount = (target || 0) - currentSaved;

  // Auto-calculate due date when allocation changes (allocation mode)
  useEffect(() => {
    if (calculationMode !== 'allocation') return;
    if (!target || !monthlyAllocation || monthlyAllocation <= 0) {
      setCalculationMessage('');
      return;
    }

    if (remainingAmount <= 0) {
      setCalculationMessage('🎉 Goal already achieved!');
      form.setValue('dueDate', new Date());
      return;
    }

    const monthsNeeded = remainingAmount / monthlyAllocation;
    const fullMonths = Math.floor(monthsNeeded);
    const remainingDays = Math.round((monthsNeeded - fullMonths) * 30);
    
    const calculatedDate = addMonths(new Date(), fullMonths);
    calculatedDate.setDate(calculatedDate.getDate() + remainingDays);
    
    form.setValue('dueDate', calculatedDate);
    
    const formattedDate = format(calculatedDate, 'dd MMM yyyy');
    if (fullMonths === 0 && remainingDays > 0) {
      setCalculationMessage(`At R${monthlyAllocation.toLocaleString()}/month, you'll reach your goal in ${remainingDays} days (${formattedDate})`);
    } else if (remainingDays > 0) {
      setCalculationMessage(`At R${monthlyAllocation.toLocaleString()}/month, you'll reach your goal in ${fullMonths} months and ${remainingDays} days (${formattedDate})`);
    } else {
      setCalculationMessage(`At R${monthlyAllocation.toLocaleString()}/month, you'll reach your goal in ${fullMonths} months (${formattedDate})`);
    }
  }, [target, currentSaved, monthlyAllocation, calculationMode, remainingAmount, form]);

  // Auto-calculate allocation when date changes (date mode)
  useEffect(() => {
    if (calculationMode !== 'date') return;
    if (!target || !dueDate) {
      setCalculationMessage('');
      return;
    }

    if (remainingAmount <= 0) {
      setCalculationMessage('🎉 Goal already achieved!');
      form.setValue('monthlyAllocation', 0);
      return;
    }

    const today = new Date();
    const totalDays = differenceInDays(dueDate, today);
    const monthsUntilDue = differenceInMonths(dueDate, today);
    
    if (totalDays <= 0) {
      setCalculationMessage('⚠️ Please select a future date');
      return;
    }

    // Calculate more precise allocation using days
    const monthsDecimal = totalDays / 30;
    const calculatedAllocation = Math.ceil(remainingAmount / monthsDecimal);
    
    form.setValue('monthlyAllocation', calculatedAllocation);
    
    const formattedDate = format(dueDate, 'dd MMM yyyy');
    if (monthsUntilDue < 1) {
      setCalculationMessage(`To reach your goal by ${formattedDate}, save R${calculatedAllocation.toLocaleString()}/month (${totalDays} days left)`);
    } else {
      setCalculationMessage(`To reach your goal by ${formattedDate}, save R${calculatedAllocation.toLocaleString()}/month`);
    }
  }, [target, currentSaved, dueDate, calculationMode, remainingAmount, form]);

  // Populate form when editing
  useEffect(() => {
    if (goalToEdit && open) {
      // Parse the timeline string to get the date
      const parseDate = (timeline: string): Date | undefined => {
        try {
          const parsed = new Date(timeline);
          if (!isNaN(parsed.getTime())) return parsed;
          const parts = timeline.split(' ');
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parts[1];
            const year = parseInt(parts[2]) + 2000;
            const dateStr = `${month} ${day}, ${year}`;
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) return date;
          }
        } catch {
          return undefined;
        }
        return undefined;
      };

      form.reset({
        name: goalToEdit.name,
        target: goalToEdit.target,
        currentSaved: goalToEdit.amountSaved,
        monthlyAllocation: goalToEdit.monthlyAllocation,
        dueDate: parseDate(goalToEdit.timeline),
      });
      
      // Set mode based on what was previously set
      setCalculationMode('allocation');
    } else if (!open) {
      form.reset({
        name: '',
        target: undefined,
        currentSaved: undefined,
        monthlyAllocation: undefined,
        dueDate: undefined,
      });
      setCalculationMessage('');
      setCalculationMode('allocation');
    }
  }, [goalToEdit, open, form]);

  const handleSubmit = async (data: GoalFormData) => {
    try {
      setIsSubmitting(true);
      if (isEditMode && onEdit && goalToEdit) {
        await onEdit(goalToEdit.id, data);
      } else {
        await onAdd(data);
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModeChange = (mode: CalculationMode) => {
    setCalculationMode(mode);
    setCalculationMessage('');
    // Clear the calculated field when switching modes
    if (mode === 'allocation') {
      form.setValue('dueDate', undefined);
    } else {
      form.setValue('monthlyAllocation', undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Emergency Fund" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount (R)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10000"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentSaved"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Saved (R)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Calculation Mode Toggle */}
            <div className="space-y-2">
              <FormLabel>How would you like to set your goal?</FormLabel>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={calculationMode === 'allocation' ? 'default' : 'outline'}
                  onClick={() => handleModeChange('allocation')}
                  className="flex-1 text-xs sm:text-sm"
                  size="sm"
                >
                  Set Monthly Amount
                </Button>
                <Button
                  type="button"
                  variant={calculationMode === 'date' ? 'default' : 'outline'}
                  onClick={() => handleModeChange('date')}
                  className="flex-1 text-xs sm:text-sm"
                  size="sm"
                >
                  Set Target Date
                </Button>
              </div>
            </div>

            {calculationMode === 'allocation' ? (
              <>
                <FormField
                  control={form.control}
                  name="monthlyAllocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Allocation (R)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="500"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <FormLabel>Estimated Completion Date</FormLabel>
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Calculator className="h-3 w-3" />
                          Auto
                        </Badge>
                      </div>
                      <div className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm",
                        !field.value && "text-muted-foreground"
                      )}>
                        {field.value ? format(field.value, "PPP") : "Enter allocation to calculate"}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Target Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a target date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyAllocation"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Required Monthly Allocation (R)</FormLabel>
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Calculator className="h-3 w-3" />
                          Auto
                        </Badge>
                      </div>
                      <div className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm",
                        !field.value && "text-muted-foreground"
                      )}>
                        {field.value ? `R${field.value.toLocaleString()}` : "Select date to calculate"}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Calculation Message */}
            {calculationMessage && (
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                {calculationMessage}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Goal')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
