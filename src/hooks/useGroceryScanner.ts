import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface ProductMatch {
  id: string;
  name: string;
  brand: string | null;
  cheapest_price_cents: number;
  cheapest_store: string;
  store_count: number;
}

export interface GroceryItem {
  id: string;
  raw_text: string;
  name: string;
  quantity: number;
  confidence: 'high' | 'medium' | 'low';
  needs_clarification: boolean;
  matches: ProductMatch[];
  selected_product: ProductMatch | null;
}

interface ScanResponse {
  success: boolean;
  items: GroceryItem[];
  total_items: number;
  needs_clarification: number;
  error?: string;
}

export const useGroceryScanner = () => {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const scanImage = useCallback(async (imageData: string) => {
    setIsScanning(true);
    setScanError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('scan-grocery-list', {
        body: { image: imageData }
      });

      if (error) {
        throw new Error(error.message || 'Failed to scan grocery list');
      }

      const response = data as ScanResponse;
      
      if (!response.success) {
        throw new Error(response.error || 'Scan failed');
      }

      // Auto-select first match for items that don't need clarification
      const processedItems = response.items.map(item => ({
        ...item,
        selected_product: !item.needs_clarification && item.matches.length > 0 
          ? item.matches[0] 
          : null
      }));

      setItems(processedItems);
      toast.success(`Found ${response.total_items} items`);
      
      if (response.needs_clarification > 0) {
        toast.info(`${response.needs_clarification} items need selection`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to scan image';
      setScanError(message);
      toast.error(message);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  }, []);

  const selectProduct = useCallback((itemId: string, product: ProductMatch | null) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, selected_product: product, needs_clarification: false } : item
    ));
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const addManualItem = useCallback((name: string) => {
    const newItem: GroceryItem = {
      id: `manual-${Date.now()}`,
      raw_text: name,
      name,
      quantity: 1,
      confidence: 'high',
      needs_clarification: true,
      matches: [],
      selected_product: null
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  const clearList = useCallback(() => {
    setItems([]);
    setScanError(null);
  }, []);

  const totals = useMemo(() => {
    const itemsWithProducts = items.filter(item => item.selected_product);
    const totalCents = itemsWithProducts.reduce((sum, item) => {
      return sum + (item.selected_product!.cheapest_price_cents * item.quantity);
    }, 0);

    // Group by store
    const storeBreakdown: Record<string, number> = {};
    itemsWithProducts.forEach(item => {
      const store = item.selected_product!.cheapest_store;
      storeBreakdown[store] = (storeBreakdown[store] || 0) + 
        (item.selected_product!.cheapest_price_cents * item.quantity);
    });

    return {
      totalCents,
      itemCount: items.length,
      selectedCount: itemsWithProducts.length,
      needsSelectionCount: items.filter(item => !item.selected_product).length,
      storeBreakdown
    };
  }, [items]);

  return {
    items,
    isScanning,
    scanError,
    scanImage,
    updateItemQuantity,
    selectProduct,
    removeItem,
    addManualItem,
    clearList,
    totals
  };
};
