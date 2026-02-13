import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/useLanguage';

interface AddManualItemDialogProps {
  onAdd: (name: string, merchant: string, priceCents: number) => void;
}

export const AddManualItemDialog = ({ onAdd }: AddManualItemDialogProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [merchant, setMerchant] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    
    const priceCents = price ? Math.round(parseFloat(price) * 100) : 0;
    onAdd(name.trim(), merchant.trim() || 'Manual', isNaN(priceCents) ? 0 : priceCents);
    
    setName('');
    setMerchant('');
    setPrice('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus size={14} />
          {t('common.add')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('groceryBudget.addItem')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t('groceryBudget.itemName')} *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('groceryBudget.itemNamePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('groceryBudget.merchant')}</Label>
            <Input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder={t('groceryBudget.merchantPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('groceryBudget.priceRands')}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            {t('common.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
