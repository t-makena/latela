import { cn } from '@/lib/utils';
import { StoreBadge } from './StoreBadge';
import { Badge } from '@/components/ui/badge';
import { formatPriceCents } from '@/lib/storeColors';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import type { ProductOffer } from '@/hooks/usePriceSearch';

interface StoreOfferRowProps {
  offer: ProductOffer;
  isCheapest: boolean;
  quantityUnit?: string | null;
}

export const StoreOfferRow = ({ offer, isCheapest, quantityUnit }: StoreOfferRowProps) => {
  const { t } = useLanguage();
  
  return (
    <div 
      className={cn(
        'flex items-center justify-between p-3 rounded-lg transition-colors',
        isCheapest ? 'bg-green-50 border border-green-200' : 'bg-muted/50',
        !offer.in_stock && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-2">
        <StoreBadge store={offer.store} />
        {isCheapest && (
          <Badge className="bg-green-600 text-white text-xs px-2 py-0.5">
            {t('compare.bestPrice')}
          </Badge>
        )}
        {offer.on_sale && (
          <Badge className="bg-orange-500 text-white text-xs px-2 py-0.5">
            {t('compare.onSale')}
          </Badge>
        )}
        {!offer.in_stock && (
          <span className="text-xs text-muted-foreground">
            {t('compare.outOfStock')}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className={cn(
            'font-bold',
            isCheapest ? 'text-green-700' : 'text-foreground'
          )}>
            {formatPriceCents(offer.price_cents)}
          </p>
          {offer.unit_price_cents && quantityUnit && (
            <p className="text-xs text-muted-foreground">
              {formatPriceCents(offer.unit_price_cents)}/{quantityUnit}
            </p>
          )}
        </div>
        
        {offer.product_url && (
          <a 
            href={offer.product_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    </div>
  );
};
