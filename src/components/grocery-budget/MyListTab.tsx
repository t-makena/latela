import { useMemo, useState } from 'react';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/hooks/useGroceryCart';
import { ProductOffer } from '@/hooks/usePriceSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { formatPriceCents } from '@/lib/storeColors';
import { CartItemCard } from './CartItemCard';
import { ScanListDialog } from './ScanListDialog';
import { AddManualItemDialog } from './AddManualItemDialog';
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
  onAddManualItem: (name: string, merchant: string, priceCents: number) => void;
  onMarkAsPurchased: (itemId: string) => void;
  onMarkAsBudgeted: (itemId: string) => void;
  onReAddItem: (itemId: string) => void;
  onAddToBudgetPlan?: (store: string, totalCents: number) => void;
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
  onAddManualItem,
  onMarkAsPurchased,
  onMarkAsBudgeted,
  onReAddItem,
  onAddToBudgetPlan,
  totalCents = 0,
  itemCount = 0,
}: MyListTabProps) => {
  const { t } = useLanguage();
  const [purchasedExpanded, setPurchasedExpanded] = useState(false);

  const consideringItems = useMemo(() => items.filter(i => i.status === 'considering'), [items]);
  const budgetedItems = useMemo(() => items.filter(i => i.status === 'budgeted'), [items]);
  const purchasedItems = useMemo(() => items.filter(i => i.status === 'purchased'), [items]);

  const handleAddToBudget = (item: CartItem) => {
    const store = item.selectedOffer.store_display_name || item.selectedOffer.store;
    
    // Group all considering items from same merchant
    const sameStoreItems = consideringItems.filter(
      i => (i.selectedOffer.store_display_name || i.selectedOffer.store) === store
    );
    
    const totalForStore = sameStoreItems.reduce(
      (sum, i) => sum + (i.selectedOffer.price_cents * i.quantity), 0
    );
    
    // Mark all same-store items as budgeted
    sameStoreItems.forEach(i => onMarkAsBudgeted(i.id));
    
    // Add to budget plan if callback provided
    if (onAddToBudgetPlan) {
      onAddToBudgetPlan(store, totalForStore);
    }
  };
  
  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2 justify-center">
          <ScanListDialog onAddItems={onAddScannedItems} />
          <AddManualItemDialog onAdd={onAddManualItem} />
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('groceryBudget.emptyList')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('groceryBudget.emptyListHint')}</p>
        </div>
      </div>
    );
  }

  const renderSection = (
    title: string, 
    sectionItems: CartItem[], 
    showBudgetAction: boolean,
    collapsed?: boolean,
    onToggleCollapse?: () => void
  ) => {
    if (sectionItems.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <button 
          className="flex items-center gap-2 w-full"
          onClick={onToggleCollapse}
          disabled={!onToggleCollapse}
        >
          {onToggleCollapse && (
            collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />
          )}
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {title} ({sectionItems.length})
          </h3>
        </button>
        
        {(!collapsed || !onToggleCollapse) && (
          <div className="space-y-3">
            {sectionItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={(qty) => onUpdateQuantity(item.id, qty)}
                onUpdateStore={(offer) => onUpdateStore(item.id, offer)}
                onRemove={() => onRemove(item.id)}
                onTogglePurchased={() => onMarkAsPurchased(item.id)}
                onAddToBudget={showBudgetAction ? () => handleAddToBudget(item) : undefined}
                onReAdd={() => onReAddItem(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Actions Row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <ScanListDialog onAddItems={onAddScannedItems} />
          <AddManualItemDialog onAdd={onAddManualItem} />
        </div>
        
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
      
      {/* Considering Section */}
      {renderSection(t('groceryBudget.considering'), consideringItems, true)}
      
      {/* Budgeted Section */}
      {renderSection(t('groceryBudget.budgeted'), budgetedItems, false)}
      
      {/* Purchased Section (collapsible) */}
      {renderSection(
        t('groceryBudget.purchased'), 
        purchasedItems, 
        false,
        !purchasedExpanded,
        () => setPurchasedExpanded(!purchasedExpanded)
      )}

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
