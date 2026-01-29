import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPriceCents } from '@/lib/storeColors';
import { ProductMatchSelector } from './ProductMatchSelector';
import type { GroceryItem, ProductMatch } from '@/hooks/useGroceryScanner';

interface GroceryItemCardProps {
  item: GroceryItem;
  onQuantityChange: (quantity: number) => void;
  onSelectProduct: (product: ProductMatch | null) => void;
  onRemove: () => void;
}

export const GroceryItemCard = ({
  item,
  onQuantityChange,
  onSelectProduct,
  onRemove
}: GroceryItemCardProps) => {
  const hasSelection = !!item.selected_product;
  const totalPrice = item.selected_product 
    ? item.selected_product.cheapest_price_cents * item.quantity 
    : 0;

  return (
    <Card 
      className={cn(
        "border-2 border-foreground p-4 transition-colors",
        hasSelection ? "bg-green-50" : "bg-amber-50"
      )}
      style={{ boxShadow: '4px 4px 0px #000000' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {hasSelection ? (
              <Check size={16} className="text-green-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
            )}
            <span className="font-semibold truncate">{item.name}</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs shrink-0",
                item.confidence === 'high' && "border-green-500 text-green-700",
                item.confidence === 'medium' && "border-amber-500 text-amber-700",
                item.confidence === 'low' && "border-red-500 text-red-700"
              )}
            >
              {item.confidence}
            </Badge>
          </div>
          
          {item.raw_text !== item.name && (
            <p className="text-xs text-muted-foreground mb-2">
              "{item.raw_text}"
            </p>
          )}
          
          {item.selected_product && (
            <p className="text-sm text-muted-foreground">
              {item.selected_product.name} • {item.selected_product.cheapest_store}
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-foreground"
              onClick={() => onQuantityChange(item.quantity - 1)}
            >
              <Minus size={14} />
            </Button>
            <span className="w-8 text-center font-semibold">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-foreground"
              onClick={() => onQuantityChange(item.quantity + 1)}
            >
              <Plus size={14} />
            </Button>
          </div>
          
          {hasSelection && (
            <p className="font-bold text-green-700">
              {formatPriceCents(totalPrice)}
            </p>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
      
      {item.matches.length > 0 && (
        <ProductMatchSelector
          matches={item.matches}
          selectedProduct={item.selected_product}
          onSelect={onSelectProduct}
        />
      )}
    </Card>
  );
};
