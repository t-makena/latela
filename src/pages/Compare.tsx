import { Search, TrendingDown, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductComparisonCard } from '@/components/compare/ProductComparisonCard';
import { SearchSuggestions } from '@/components/compare/SearchSuggestions';
import { usePriceSearch } from '@/hooks/usePriceSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const Compare = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { 
    searchQuery, 
    setSearchQuery, 
    products, 
    isLoading, 
    totalResults 
  } = usePriceSearch();

  return (
    <div className={cn("min-h-screen", isMobile ? "pt-20" : "")}>
      <div className={cn(isMobile ? "px-4 py-4" : "px-6 py-6")}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown size={28} className="text-foreground" />
            <h1 className="text-2xl font-bold">{t('compare.title')}</h1>
          </div>
          <p className="text-muted-foreground">
            {t('compare.searchPrompt')}
          </p>
        </div>

        {/* Sticky Search Bar */}
        <div className={cn(
          "sticky top-0 z-10 pb-4 bg-transparent",
          isMobile && "top-16"
        )}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('compare.searchPlaceholder')}
              className="pl-10 h-12 text-base border-2 border-foreground rounded-xl bg-background"
              style={{ boxShadow: '3px 3px 0px #000000' }}
            />
          </div>
        </div>

        {/* Search Suggestions (when no search) */}
        {!searchQuery && !isLoading && products.length === 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-muted-foreground mb-3">Quick search:</p>
            <SearchSuggestions onSelect={setSearchQuery} />
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-2 border-foreground rounded-xl p-4 bg-card" style={{ boxShadow: '4px 4px 0px #000000' }}>
                <Skeleton className="h-20 w-20 rounded-lg mb-3" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg mt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!isLoading && products.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {totalResults} products found for "{searchQuery}"
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductComparisonCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        {/* No Results */}
        {!isLoading && searchQuery && products.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('compare.noResults')}</h3>
            <p className="text-muted-foreground">
              Try a different search term
            </p>
          </div>
        )}

        {/* Empty State (no search yet) */}
        {!isLoading && !searchQuery && products.length === 0 && (
          <div className="text-center py-12 mt-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-4">
              <TrendingDown size={48} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Compare Grocery Prices</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Search for products to compare prices across Pick n Pay, Checkers, Shoprite, and Woolworths
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Compare;
