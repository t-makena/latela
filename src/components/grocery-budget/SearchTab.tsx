import { useState, useMemo } from 'react';
import { Search, Flame } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePriceSearch, SearchProduct, ProductOffer } from '@/hooks/usePriceSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { StoreFilterPills, StoreFilter } from './StoreFilterPills';
import { GrocerySearchResultCard } from './GrocerySearchResultCard';
import { cn } from '@/lib/utils';

interface SearchTabProps {
  onAddToCart: (product: SearchProduct, selectedOffer?: ProductOffer) => void;
}

export const SearchTab = ({ onAddToCart }: SearchTabProps) => {
  const { t } = useLanguage();
  const { searchQuery, setSearchQuery, products, isLoading } = usePriceSearch();
  const [selectedStore, setSelectedStore] = useState<StoreFilter>('all');
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  
  // Filter products based on store and sale filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Filter offers based on selected store
      const storeFilteredOffers = selectedStore === 'all'
        ? product.offers
        : product.offers.filter(offer => offer.store.toLowerCase() === selectedStore);
      
      // Filter by on sale if enabled
      const saleFilteredOffers = onSaleOnly
        ? storeFilteredOffers.filter(offer => offer.on_sale)
        : storeFilteredOffers;
      
      // Only include products that have offers after filtering
      return saleFilteredOffers.length > 0;
    });
  }, [products, selectedStore, onSaleOnly]);

  const showEmptyState = searchQuery.length < 2 && products.length === 0;
  const showNoResults = searchQuery.length >= 2 && !isLoading && filteredProducts.length === 0;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          placeholder={t('groceryBudget.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <StoreFilterPills 
          selectedStore={selectedStore} 
          onStoreChange={setSelectedStore} 
        />
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOnSaleOnly(!onSaleOnly)}
          className={cn(
            "gap-1.5 rounded-full",
            onSaleOnly && "bg-orange-100 border-orange-300 text-orange-800"
          )}
        >
          <Flame size={14} />
          {t('groceryBudget.onSaleOnly')}
        </Button>
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
