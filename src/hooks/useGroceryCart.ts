import { useState, useEffect, useCallback, useMemo } from "react";
import { ProductOffer } from "./usePriceSearch";

export type CartItemStatus = 'considering' | 'budgeted' | 'purchased';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  brand: string | null;
  imageUrl: string | null;
  quantityValue: number | null;
  quantityUnit: string | null;
  selectedOffer: ProductOffer;
  availableOffers: ProductOffer[];
  quantity: number;
  addedAt: number;
  status: CartItemStatus;
}

interface AddToCartParams {
  productId: string;
  productName: string;
  brand: string | null;
  imageUrl: string | null;
  quantityValue: number | null;
  quantityUnit: string | null;
  offers: ProductOffer[];
  selectedOffer?: ProductOffer;
}

const CART_STORAGE_KEY = "grocery-cart";

export const useGroceryCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount, migrate old items without status
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        let parsed;
        try {
          parsed = JSON.parse(stored);
        } catch {
          console.warn("Corrupted grocery cart data in localStorage, resetting.");
          localStorage.removeItem(CART_STORAGE_KEY);
          parsed = [];
        }
        // Migration: add status field to old items
        const migrated = parsed.map((item: any) => ({
          ...item,
          status: item.status || 'considering',
        }));
        setItems(migrated);
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error("Failed to save cart to localStorage:", error);
      }
    }
  }, [items, isInitialized]);

  const addToCart = useCallback((params: AddToCartParams) => {
    const {
      productId, productName, brand, imageUrl,
      quantityValue, quantityUnit, offers, selectedOffer,
    } = params;

    const cheapestOffer = offers.reduce(
      (min, offer) => (offer.price_cents < min.price_cents ? offer : min),
      offers[0],
    );
    const offerToUse = selectedOffer || cheapestOffer;

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === productId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
          availableOffers: offers,
        };
        return updated;
      }
      const newItem: CartItem = {
        id: `${productId}-${Date.now()}`,
        productId, productName, brand, imageUrl,
        quantityValue, quantityUnit,
        selectedOffer: offerToUse,
        availableOffers: offers,
        quantity: 1,
        addedAt: Date.now(),
        status: 'considering',
      };
      return [...prev, newItem];
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
    );
  }, []);

  const updateStore = useCallback((itemId: string, newOffer: ProductOffer) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, selectedOffer: newOffer } : item,
      ),
    );
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const markAsBudgeted = useCallback((itemId: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, status: 'budgeted' as CartItemStatus } : item
    ));
  }, []);

  const markAsPurchased = useCallback((itemId: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, status: 'purchased' as CartItemStatus } : item
    ));
  }, []);

  const reAddItem = useCallback((itemId: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, status: 'considering' as CartItemStatus } : item
    ));
  }, []);

  const markMerchantAsBudgeted = useCallback((store: string) => {
    setItems(prev => prev.map(item =>
      item.selectedOffer.store === store && item.status === 'considering'
        ? { ...item, status: 'budgeted' as CartItemStatus }
        : item
    ));
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const totalCents = useMemo(
    () => items.reduce((sum, item) => sum + item.selectedOffer.price_cents * item.quantity, 0),
    [items],
  );

  const storeBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; totalCents: number }> = {};
    items.forEach((item) => {
      const store = item.selectedOffer.store;
      if (!breakdown[store]) {
        breakdown[store] = { count: 0, totalCents: 0 };
      }
      breakdown[store].count += item.quantity;
      breakdown[store].totalCents += item.selectedOffer.price_cents * item.quantity;
    });
    return breakdown;
  }, [items]);

  return {
    items, addToCart, updateQuantity, updateStore,
    removeFromCart, clearCart, markAsBudgeted, markAsPurchased,
    reAddItem, markMerchantAsBudgeted, itemCount, totalCents,
    storeBreakdown, isInitialized,
  };
};
