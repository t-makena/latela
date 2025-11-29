import { useState } from 'react';
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
import { useSubcategories } from '@/hooks/useSubcategories';

interface AddBudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, frequency: string, amount: number, daysPerWeek?: number) => void;
}

const FREQUENCIES = ['Monthly', 'Weekly', 'Bi-weekly', 'Daily', 'Once-off'];

export const AddBudgetItemDialog = ({
  open,
  onOpenChange,
  onAdd,
}: AddBudgetItemDialogProps) => {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('Monthly');
  const [amount, setAmount] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState('7');
  const [useCustomName, setUseCustomName] = useState(false);
  
  // Fetch all subcategories with custom replacements applied
  const { subcategories, loading: categoriesLoading } = useSubcategories();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !amount) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    const numericDaysPerWeek = frequency === 'Daily' ? parseInt(daysPerWeek) : undefined;

    onAdd(name, frequency, numericAmount, numericDaysPerWeek);
    
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
            <Button type="submit">Add Item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
