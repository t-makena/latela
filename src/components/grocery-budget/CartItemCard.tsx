import { Minus, Plus, Trash2, RotateCcw, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { CartItem, CartItemStatus } from '@/hooks/useGroceryCart';
import { ProductOffer } from '@/hooks/usePriceSearch';
import { storeColors, StoreKey, formatPriceCents } from '@/lib/storeColors';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onUpdateStore: (offer: ProductOffer) => void;
  onRemove: () => void;
  onTogglePurchased?: () => void;
  onAddToBudget?: () => void;
  onReAdd?: () => void;
}

export const CartItemCard = ({ 
  item, 
  onUpdateQuantity, 
  onUpdateStore, 
  onRemove,
  onTogglePurchased,
  onAddToBudget,
  onReAdd,
}: CartItemCardProps) => {
  const storeKey = item.selectedOffer.store.toLowerCase() as StoreKey;
  const colors = storeColors[storeKey] || { bg: 'bg-gray-100', text: 'text-gray-800', name: item.selectedOffer.store };
  
  const subtotal = item.selectedOffer.price_cents * item.quantity;
  const isPurchased = item.status === 'purchased';
  
  const cycleStore = () => {
    const currentIndex = item.availableOffers.findIndex(
      o => o.store === item.selectedOffer.store
    );
    const nextIndex = (currentIndex + 1) % item.availableOffers.length;
    onUpdateStore(item.availableOffers[nextIndex]);
  };
  
  const quantityText = item.quantityValue && item.quantityUnit 
    ? `${item.quantityValue}${item.quantityUnit}`
    : null;
  
  const brandAndQuantity = [item.brand, quantityText].filter(Boolean).join(' · ');

  return (
    <Card className={cn("p-4", isPurchased && "opacity-60")} style={{ boxShadow: '4px 4px 0px #000000' }}>
      <div className="flex gap-3">
        {/* Checkbox for tick-off */}
        <div className="flex items-start pt-1">
          <Checkbox 
            checked={isPurchased}
            onCheckedChange={() => {
              if (isPurchased && onReAdd) {
                onReAdd();
              } else if (onTogglePurchased) {
                onTogglePurchased();
              }
            }}
          />
        </div>

        {/* Product Image */}
        <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
          {item.imageUrl ? (
            <img 
              src={item.imageUrl} 
              alt={item.productName}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-semibold text-sm line-clamp-1 mb-0.5", isPurchased && "line-through")}>{item.productName}</h3>
          {brandAndQuantity && (
            <p className="text-xs text-muted-foreground mb-2">{brandAndQuantity}</p>
          )}
          
          {/* Store Badge - Tappable to cycle */}
          <div className="flex items-center gap-2">
            <button
              onClick={cycleStore}
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80",
                colors.bg,
                colors.text
              )}
            >
              {colors.name}: {formatPriceCents(item.selectedOffer.price_cents)}
            </button>
            
            {/* Add to Budget button - only for considering items */}
            {item.status === 'considering' && onAddToBudget && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onAddToBudget}
                title="Add to Budget"
              >
                <Bookmark size={14} />
              </Button>
            )}
          </div>
        </div>
        
        {/* Quantity Controls & Actions */}
        <div className="flex flex-col items-end gap-2">
          {/* Subtotal */}
          <span className={cn("font-bold text-sm", isPurchased && "line-through")}>{formatPriceCents(subtotal)}</span>
          
          {!isPurchased && (
            <>
              {/* Quantity Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onUpdateQuantity(item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus size={14} />
                </Button>
                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onUpdateQuantity(item.quantity + 1)}
                >
                  <Plus size={14} />
                </Button>
              </div>
              
              {/* Remove Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onRemove}
              >
                <Trash2 size={14} />
              </Button>
            </>
          )}

          {/* Re-add button for purchased items */}
          {isPurchased && onReAdd && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onReAdd}
            >
              <RotateCcw size={14} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
