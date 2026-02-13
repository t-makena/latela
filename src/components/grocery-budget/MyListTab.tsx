import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/hooks/useGroceryCart';
import { ProductOffer } from '@/hooks/usePriceSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { formatPriceCents } from '@/lib/storeColors';
import { CartItemCard } from './CartItemCard';
import { ScanListDialog } from './ScanListDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MyListTabProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onUpdateStore: (itemId: string, offer: ProductOffer) => void;
  onRemove: (itemId: string) => void;
  onClearCart: () => void;
  onAddScannedItems: (items: Array<{
    productId: string;
    productName: string;
    brand: string | null;
    imageUrl: string | null;
    quantityValue: number | null;
    quantityUnit: string | null;
    offers: Array<{
      store: string;
      store_display_name: string;
      price_cents: number;
      unit_price_cents: number | null;
      in_stock: boolean;
      on_sale: boolean;
      promotion_text: string | null;
      product_url: string | null;
    }>;
  }>) => void;
  totalCents?: number;
  itemCount?: number;
}

export const MyListTab = ({ 
  items, 
  onUpdateQuantity, 
  onUpdateStore, 
  onRemove, 
  onClearCart,
  onAddScannedItems,
  totalCents = 0,
  itemCount = 0,
}: MyListTabProps) => {
  const { t } = useLanguage();
  
  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <ScanListDialog onAddItems={onAddScannedItems} />
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('groceryBudget.emptyList')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('groceryBudget.emptyListHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions Row */}
      <div className="flex items-center justify-between">
        <ScanListDialog onAddItems={onAddScannedItems} />
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
              <Trash2 size={14} />
              {t('groceryBudget.clearList')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('groceryBudget.clearList')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('groceryBudget.confirmClear')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={onClearCart}>{t('common.confirm')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      {/* Cart Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <CartItemCard
            key={item.id}
            item={item}
            onUpdateQuantity={(qty) => onUpdateQuantity(item.id, qty)}
            onUpdateStore={(offer) => onUpdateStore(item.id, offer)}
            onRemove={() => onRemove(item.id)}
          />
        ))}
      </div>

      {/* Total at end of list */}
      {itemCount > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">
              {t('groceryBudget.itemsTotal').replace('{{count}}', itemCount.toString())}
            </span>
            <span className="font-bold text-lg text-foreground">
              {formatPriceCents(totalCents)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
