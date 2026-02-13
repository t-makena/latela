import { useState } from 'react';
import { ShoppingCart, Search } from 'lucide-react';
import { useGroceryCart } from '@/hooks/useGroceryCart';
import { SearchProduct, ProductOffer } from '@/hooks/usePriceSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatPriceCents } from '@/lib/storeColors';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { SearchTab } from '@/components/grocery-budget/SearchTab';
import { MyListTab } from '@/components/grocery-budget/MyListTab';

type TabType = 'search' | 'list';

const GroceryBudget = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabType>('search');
  
  const {
    items,
    addToCart,
    updateQuantity,
    updateStore,
    removeFromCart,
    clearCart,
    markAsBudgeted,
    markAsPurchased,
    reAddItem,
    itemCount,
    totalCents,
  } = useGroceryCart();
  
  const handleAddToCart = (product: SearchProduct, selectedOffer?: ProductOffer) => {
    addToCart({
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      imageUrl: product.image_url,
      quantityValue: product.quantity_value,
      quantityUnit: product.quantity_unit,
      offers: product.offers,
      selectedOffer,
    });
    toast.success(t('groceryBudget.addedToList'));
  };
  
  const handleAddScannedItems = (scannedItems: Array<{
    productId: string;
    productName: string;
    brand: string | null;
    imageUrl: string | null;
    quantityValue: number | null;
    quantityUnit: string | null;
    offers: Array<{
      store: string;
      store_display_name: string;
      price_cents: number;
      unit_price_cents: number | null;
      in_stock: boolean;
      on_sale: boolean;
      promotion_text: string | null;
      product_url: string | null;
    }>;
  }>) => {
    scannedItems.forEach(item => {
      addToCart({
        productId: item.productId,
        productName: item.productName,
        brand: item.brand,
        imageUrl: item.imageUrl,
        quantityValue: item.quantityValue,
        quantityUnit: item.quantityUnit,
        offers: item.offers,
      });
    });
  };

  const handleAddManualItem = (name: string, merchant: string, priceCents: number) => {
    addToCart({
      productId: `manual-${Date.now()}`,
      productName: name,
      brand: null,
      imageUrl: null,
      quantityValue: null,
      quantityUnit: null,
      offers: [{
        store: merchant,
        store_display_name: merchant,
        price_cents: priceCents,
        unit_price_cents: null,
        in_stock: true,
        on_sale: false,
        promotion_text: null,
        product_url: null,
      }],
    });
    toast.success(t('groceryBudget.addedToList'));
  };
  return (
    <div className="flex flex-col min-h-full pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart size={28} />
        <h1 className="text-2xl font-bold">{t('groceryBudget.title')}</h1>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('search')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors border-2",
            activeTab === 'search'
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-foreground border-foreground hover:bg-accent"
          )}
        >
          <Search size={18} />
          {t('groceryBudget.searchTab')}
        </button>
        
        <button
          onClick={() => setActiveTab('list')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors border-2",
            activeTab === 'list'
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-foreground border-foreground hover:bg-accent"
          )}
        >
          <ShoppingCart size={18} />
          {t('groceryBudget.myListTab')} ({itemCount})
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'search' ? (
          <SearchTab onAddToCart={handleAddToCart} />
        ) : (
          <MyListTab
            items={items}
            onUpdateQuantity={updateQuantity}
            onUpdateStore={updateStore}
            onRemove={removeFromCart}
            onClearCart={clearCart}
            onAddScannedItems={handleAddScannedItems}
            onAddManualItem={handleAddManualItem}
            onMarkAsPurchased={markAsPurchased}
            onMarkAsBudgeted={markAsBudgeted}
            onReAddItem={reAddItem}
          />
        )}
      </div>
      
      {/* Sticky Footer */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background border-t-2 border-foreground py-4 px-6",
          isMobile ? "" : "ml-24 lg:ml-64"
        )}
        style={{ boxShadow: '0 -4px 0px 0px rgba(0,0,0,1)' }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {itemCount === 0 ? (
            <span className="text-muted-foreground">
              {t('groceryBudget.estMonthlyBudget')}: R0.00
            </span>
          ) : (
            <span className="font-semibold">
              {t('groceryBudget.itemsTotal').replace('{{count}}', itemCount.toString())}: {formatPriceCents(totalCents)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroceryBudget;
