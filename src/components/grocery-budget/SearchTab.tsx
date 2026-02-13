import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Flame } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { usePriceSearch, SearchProduct, ProductOffer } from '@/hooks/usePriceSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { type StoreFilter } from './StoreFilterPills';
import { GrocerySearchResultCard } from './GrocerySearchResultCard';
import { cn } from '@/lib/utils';

const stores: { key: StoreFilter; label: string; tKey?: string }[] = [
  { key: 'all', label: 'All', tKey: 'groceryBudget.filterAll' },
  { key: 'checkers', label: 'Checkers' },
  { key: 'makro', label: 'Makro' },
  { key: 'pnp', label: 'PnP' },
  { key: 'woolworths', label: 'Woolies' },
];

interface SearchTabProps {
  onAddToCart: (product: SearchProduct, selectedOffer?: ProductOffer) => void;
}

export const SearchTab = ({ onAddToCart }: SearchTabProps) => {
  const { t } = useLanguage();
  const { searchQuery, setSearchQuery, products, isLoading } = usePriceSearch();
  const [selectedStore, setSelectedStore] = useState<StoreFilter>('all');
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  
  const hasActiveFilter = selectedStore !== 'all' || onSaleOnly;

  // Filter products based on store and sale filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const storeFilteredOffers = selectedStore === 'all'
        ? product.offers
        : product.offers.filter(offer => offer.store.toLowerCase() === selectedStore);
      const saleFilteredOffers = onSaleOnly
        ? storeFilteredOffers.filter(offer => offer.on_sale)
        : storeFilteredOffers;
      return saleFilteredOffers.length > 0;
    });
  }, [products, selectedStore, onSaleOnly]);

  const showEmptyState = searchQuery.length < 2 && products.length === 0;
  const showNoResults = searchQuery.length >= 2 && !isLoading && filteredProducts.length === 0;

  return (
    <div className="space-y-4">
      {/* Search Input + Filter Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder={t('groceryBudget.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative shrink-0">
              <SlidersHorizontal size={18} />
              {hasActiveFilter && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-foreground" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 bg-card border-foreground p-2 z-50">
            <div className="space-y-1">
              {stores.map((store) => (
                <button
                  key={store.key}
                  onClick={() => setSelectedStore(store.key)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    selectedStore === store.key
                      ? "bg-foreground text-background"
                      : "hover:bg-accent"
                  )}
                >
                  {store.tKey ? t(store.tKey) : store.label}
                </button>
              ))}
            </div>
            <div className="border-t border-border mt-2 pt-2">
              <button
                onClick={() => setOnSaleOnly(!onSaleOnly)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  onSaleOnly ? "bg-orange-100 text-orange-800" : "hover:bg-accent"
                )}
              >
                <Flame size={14} />
                {t('groceryBudget.onSaleOnly')}
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Results */}
      <div className="space-y-3">
        {isLoading && (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        )}
        
        {showEmptyState && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('groceryBudget.searchEmpty')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('groceryBudget.searchHint')}</p>
          </div>
        )}
        
        {showNoResults && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('compare.noResults')}</p>
          </div>
        )}
        
        {!isLoading && filteredProducts.map((product) => (
          <GrocerySearchResultCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            storeFilter={selectedStore}
          />
        ))}
      </div>
    </div>
  );
};
