import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CartItem } from '@/hooks/useGroceryCart';
import { ProductOffer } from '@/hooks/usePriceSearch';
import { storeColors, StoreKey, formatPriceCents } from '@/lib/storeColors';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onUpdateStore: (offer: ProductOffer) => void;
  onRemove: () => void;
}

export const CartItemCard = ({ 
  item, 
  onUpdateQuantity, 
  onUpdateStore, 
  onRemove 
}: CartItemCardProps) => {
  const storeKey = item.selectedOffer.store.toLowerCase() as StoreKey;
  const colors = storeColors[storeKey] || { bg: 'bg-gray-100', text: 'text-gray-800', name: item.selectedOffer.store };
  
  const subtotal = item.selectedOffer.price_cents * item.quantity;
  
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
    <Card className="p-4" style={{ boxShadow: '4px 4px 0px #000000' }}>
      <div className="flex gap-3">
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
          <h3 className="font-semibold text-sm line-clamp-1 mb-0.5">{item.productName}</h3>
          {brandAndQuantity && (
            <p className="text-xs text-muted-foreground mb-2">{brandAndQuantity}</p>
          )}
          
          {/* Store Badge - Tappable to cycle */}
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
        </div>
        
        {/* Quantity Controls & Actions */}
        <div className="flex flex-col items-end gap-2">
          {/* Subtotal */}
          <span className="font-bold text-sm">{formatPriceCents(subtotal)}</span>
          
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
        </div>
      </div>
    </Card>
  );
};
