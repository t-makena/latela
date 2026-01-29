import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StoreOfferRow } from './StoreOfferRow';
import { formatPriceCents } from '@/lib/storeColors';
import { useLanguage } from '@/hooks/useLanguage';
import type { SearchProduct } from '@/hooks/usePriceSearch';

interface ProductComparisonCardProps {
  product: SearchProduct;
}

export const ProductComparisonCard = ({ product }: ProductComparisonCardProps) => {
  const { t } = useLanguage();
  
  const quantityDisplay = product.quantity_value && product.quantity_unit
    ? `${product.quantity_value}${product.quantity_unit}`
    : null;

  return (
    <Card 
      className="border-2 border-foreground bg-card overflow-hidden"
      style={{ boxShadow: '4px 4px 0px #000000' }}
    >
      <CardHeader className="pb-3">
        <div className="flex gap-4">
          {product.image_url && (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-20 h-20 object-contain rounded-lg bg-white border border-border"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg leading-tight line-clamp-2">
              {product.name}
            </h3>
            {product.brand && (
              <p className="text-sm text-muted-foreground mt-1">
                {product.brand}
              </p>
            )}
            {quantityDisplay && (
              <p className="text-sm text-muted-foreground">
                {quantityDisplay}
              </p>
            )}
          </div>
        </div>
        
        {product.potential_savings_cents > 0 && (
          <div className="mt-3 p-2 bg-green-100 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-800">
              {t('compare.savingsMessage', { 
                amount: (product.potential_savings_cents / 100).toFixed(2) 
              })}
            </p>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          {product.offers.map((offer, index) => (
            <StoreOfferRow 
              key={offer.store}
              offer={offer}
              isCheapest={index === 0}
              quantityUnit={product.quantity_unit}
            />
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground mt-3 text-center">
          {t('compare.storesAvailable', { count: product.store_count })}
        </p>
      </CardContent>
    </Card>
  );
};
