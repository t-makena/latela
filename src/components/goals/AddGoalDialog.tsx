import { useState } from 'react';
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

type GoalFormData = z.infer<typeof goalSchema>;

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

  // Populate form when editing
  useEffect(() => {
    if (goalToEdit && open) {
      // Parse the timeline string to get the date
      const parseDate = (timeline: string): Date | undefined => {
        try {
          // timeline is in format "dd Mon yy" e.g., "15 Dec 25"
          const parsed = new Date(timeline);
          if (!isNaN(parsed.getTime())) return parsed;
          // Try parsing with full year assumption
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
    } else if (!open) {
      form.reset({
        name: '',
        target: undefined,
        currentSaved: undefined,
        monthlyAllocation: undefined,
        dueDate: undefined,
      });
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

            <FormField
              control={form.control}
              name="monthlyAllocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Allocation (R)</FormLabel>
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

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
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
                            <span>Pick a due date</span>
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
