import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getStoreDisplayName } from '@/lib/storeColors';

export interface ProductOffer {
  store: string;
  store_display_name: string;
  price_cents: number;
  unit_price_cents: number | null;
  in_stock: boolean;
  on_sale: boolean;
  promotion_text: string | null;
  product_url: string | null;
}

export interface SearchProduct {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  quantity_value: number | null;
  quantity_unit: string | null;
  image_url: string | null;
  offers: ProductOffer[];
  cheapest_store: string | null;
  cheapest_price_cents: number | null;
  potential_savings_cents: number;
  store_count: number;
}

interface SearchResponse {
  success: boolean;
  query: string;
  total_results: number;
  products: SearchProduct[];
}

const searchProducts = async (query: string): Promise<SearchResponse> => {
  if (!query.trim()) {
    return { success: true, query: '', total_results: 0, products: [] };
  }

  const { data, error } = await supabase.functions.invoke('search-products', {
    body: { query: query.trim() }
  });

  if (error) {
    throw new Error(error.message || 'Failed to search products');
  }

  return data as SearchResponse;
};

export const usePriceSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
    
    setDebounceTimer(timer);
  }, [debounceTimer]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  }, [debounceTimer]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['product-search', debouncedQuery],
    queryFn: () => searchProducts(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const products = useMemo(() => {
    if (!data?.products) return [];
    
    return data.products.map(product => ({
      ...product,
      offers: product.offers.map(offer => ({
        ...offer,
        store_display_name: getStoreDisplayName(offer.store)
      }))
    }));
  }, [data?.products]);

  return {
    searchQuery,
    setSearchQuery: handleSearchChange,
    clearSearch,
    products,
    isLoading,
    error: error as Error | null,
    totalResults: data?.total_results || 0,
    refetch
  };
};
