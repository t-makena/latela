import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { CartItem } from '@/hooks/useGroceryCart';
import { ProductOffer } from '@/hooks/usePriceSearch';

const CART_STORAGE_KEY = 'grocery-cart';

const AddToList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const name = searchParams.get('name');
    const price = searchParams.get('price');
    const store = searchParams.get('store');
    const brand = searchParams.get('brand');
    const image = searchParams.get('image');

    if (!name || !price || !store) {
      toast.error('Missing required parameters (name, price, store)');
      navigate('/budget?view=grocery&tab=list', { replace: true });
      return;
    }

    const priceCents = parseInt(price, 10);
    if (isNaN(priceCents)) {
      toast.error('Invalid price value');
      navigate('/budget?view=grocery&tab=list', { replace: true });
      return;
    }

    try {
      // Read existing cart
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      const existingItems: CartItem[] = stored ? JSON.parse(stored) : [];

      const offer: ProductOffer = {
        store,
        store_display_name: store,
        price_cents: priceCents,
        unit_price_cents: null,
        in_stock: true,
        on_sale: false,
        promotion_text: null,
        product_url: null,
      };

      const now = Date.now();
      const newItem: CartItem = {
        id: `ext-${now}`,
        productId: `ext-${name}-${now}`,
        productName: name,
        brand: brand || null,
        imageUrl: image || null,
        quantityValue: null,
        quantityUnit: null,
        selectedOffer: offer,
        availableOffers: [offer],
        quantity: 1,
        addedAt: now,
        status: 'considering',
      };

      const updatedItems = [...existingItems, newItem];
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedItems));

      toast.success(`${name} added to your list`);
    } catch (error) {
      console.error('Failed to add item to list:', error);
      toast.error('Failed to add item to list');
    }

    navigate('/budget?view=grocery&tab=list', { replace: true });
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
    </div>
  );
};

export default AddToList;
