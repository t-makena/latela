import { useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImageUploader } from '@/components/scan/ImageUploader';
import { useGroceryScanner } from '@/hooks/useGroceryScanner';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from '@/components/ui/sonner';

interface ScanListDialogProps {
  onAddItems: (items: Array<{
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
  }>) => void;
}

export const ScanListDialog = ({ onAddItems }: ScanListDialogProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const { items, isScanning, scanImage, clearList } = useGroceryScanner();
  
  const handleImageCapture = async (base64: string) => {
    await scanImage(base64);
  };
  
  const handleAddAll = () => {
    const itemsWithMatches = items.filter(item => item.selected_product || item.matches.length > 0);
    
    const itemsToAdd = itemsWithMatches.map(item => {
      const match = item.selected_product || item.matches[0];
      return {
        productId: match.id,
        productName: match.name,
        brand: match.brand,
        imageUrl: null, // ProductMatch doesn't have image_url
        quantityValue: null,
        quantityUnit: null,
        offers: [{
          store: match.cheapest_store,
          store_display_name: match.cheapest_store,
          price_cents: match.cheapest_price_cents,
          unit_price_cents: null,
          in_stock: true,
          on_sale: false,
          promotion_text: null,
          product_url: null,
        }],
      };
    });
    
    if (itemsToAdd.length > 0) {
      onAddItems(itemsToAdd);
      toast.success(t('groceryBudget.itemsAdded').replace('{{count}}', itemsToAdd.length.toString()));
      clearList();
      setOpen(false);
    }
  };
  
  const matchedCount = items.filter(item => item.selected_product || item.matches.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Camera size={18} />
          {t('groceryBudget.scanList')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('groceryBudget.scanList')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('groceryBudget.scanListDesc')}
          </p>
          
          <ImageUploader onImageCapture={handleImageCapture} isLoading={isScanning} />
          
          {items.length > 0 && !isScanning && (
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">{t('scan.itemsFound').replace('{{count}}', items.length.toString())}</span>
                {matchedCount > 0 && (
                  <span className="text-muted-foreground ml-2">
                    ({matchedCount} with matches)
                  </span>
                )}
              </div>
              
              <div className="max-h-48 overflow-y-auto space-y-2">
                {items.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm"
                  >
                    <span className="truncate">{item.name}</span>
                    {item.selected_product || item.matches.length > 0 ? (
                      <span className="text-primary text-xs shrink-0 ml-2">✓ Found</span>
                    ) : (
                      <span className="text-muted-foreground text-xs shrink-0 ml-2">No match</span>
                    )}
                  </div>
                ))}
              </div>
              
              {matchedCount > 0 && (
                <Button 
                  onClick={handleAddAll} 
                  className="w-full"
                >
                  {t('groceryBudget.addAllToList')} ({matchedCount})
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
