import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPriceCents } from '@/lib/storeColors';
import { useLanguage } from '@/hooks/useLanguage';
import type { ProductMatch } from '@/hooks/useGroceryScanner';

interface ProductMatchSelectorProps {
  matches: ProductMatch[];
  selectedProduct: ProductMatch | null;
  onSelect: (product: ProductMatch | null) => void;
}

export const ProductMatchSelector = ({
  matches,
  selectedProduct,
  onSelect
}: ProductMatchSelectorProps) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(!selectedProduct);

  if (matches.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-foreground/20">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between h-auto py-2 px-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-sm font-medium">
          {selectedProduct ? 'Change product' : t('scan.selectProduct')}
        </span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </Button>
      
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {matches.map((match) => {
            const isSelected = selectedProduct?.id === match.id;
            return (
              <button
                key={match.id}
                onClick={() => onSelect(isSelected ? null : match)}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-colors border-2",
                  isSelected 
                    ? "border-green-500 bg-green-100" 
                    : "border-transparent bg-white hover:bg-gray-50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{match.name}</p>
                    {match.brand && (
                      <p className="text-xs text-muted-foreground">{match.brand}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {match.cheapest_store} • {match.store_count} stores
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-green-700">
                      {formatPriceCents(match.cheapest_price_cents)}
                    </span>
                    {isSelected && <Check size={16} className="text-green-600" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
