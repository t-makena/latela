import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SearchProduct, ProductOffer } from '@/hooks/usePriceSearch';
import { storeColors, StoreKey, formatPriceCents } from '@/lib/storeColors';
import { useLanguage } from '@/hooks/useLanguage';

interface GrocerySearchResultCardProps {
  product: SearchProduct;
  onAddToCart: (product: SearchProduct, selectedOffer?: ProductOffer) => void;
  storeFilter?: string;
}

export const GrocerySearchResultCard = ({ 
  product, 
  onAddToCart,
  storeFilter 
}: GrocerySearchResultCardProps) => {
  const { t } = useLanguage();
  
  // Filter offers based on store filter
  const filteredOffers = storeFilter && storeFilter !== 'all'
    ? product.offers.filter(offer => offer.store.toLowerCase() === storeFilter)
    : product.offers;
  
  // Find cheapest offer among filtered offers
  const cheapestOffer = filteredOffers.length > 0
    ? filteredOffers.reduce((min, offer) => 
        offer.price_cents < min.price_cents ? offer : min, filteredOffers[0]
      )
    : null;
  
  if (filteredOffers.length === 0) return null;
  
  const quantityText = product.quantity_value && product.quantity_unit 
    ? `${product.quantity_value}${product.quantity_unit}`
    : null;
  
  const brandAndQuantity = [product.brand, quantityText].filter(Boolean).join(' · ');

  return (
    <Card className="p-4" style={{ boxShadow: '4px 4px 0px #000000' }}>
      <div className="flex gap-3">
        {/* Product Image */}
        <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
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
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</h3>
          {brandAndQuantity && (
            <p className="text-xs text-muted-foreground mb-2">{brandAndQuantity}</p>
          )}
          
          {/* Price Pills */}
          <div className="flex flex-wrap gap-1.5">
            {filteredOffers.map((offer) => {
              const storeKey = offer.store.toLowerCase() as StoreKey;
              const colors = storeColors[storeKey] || { bg: 'bg-gray-100', text: 'text-gray-800', name: offer.store };
              const isCheapest = cheapestOffer && offer.store === cheapestOffer.store && offer.price_cents === cheapestOffer.price_cents;
              const isOnSale = offer.on_sale;
              
              return (
                <div key={offer.store} className="flex items-center gap-1">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    colors.bg,
                    colors.text
                  )}>
                    {colors.name}: {formatPriceCents(offer.price_cents)}
                  </span>
                  {isCheapest && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">
                      {t('compare.bestPrice')}
                    </span>
                  )}
                  {isOnSale && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent text-accent-foreground border border-foreground">
                      {t('compare.onSale')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Unit Price */}
          {cheapestOffer?.unit_price_cents && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {formatPriceCents(cheapestOffer.unit_price_cents)}/100{product.quantity_unit || 'g'}
            </p>
          )}
        </div>
        
        {/* Add Button */}
        <Button
          size="sm"
          onClick={() => onAddToCart(product, cheapestOffer || undefined)}
          className="shrink-0 h-8 px-3"
        >
          <Plus size={16} className="mr-1" />
          {t('groceryBudget.addToList')}
        </Button>
      </div>
    </Card>
  );
};
