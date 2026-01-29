import { useState } from 'react';
import { Camera, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUploader } from '@/components/scan/ImageUploader';
import { GroceryItemCard } from '@/components/scan/GroceryItemCard';
import { ListSummary } from '@/components/scan/ListSummary';
import { useGroceryScanner } from '@/hooks/useGroceryScanner';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const Scan = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [manualInput, setManualInput] = useState('');
  
  const {
    items,
    isScanning,
    scanImage,
    updateItemQuantity,
    selectProduct,
    removeItem,
    addManualItem,
    clearList,
    totals
  } = useGroceryScanner();

  const handleAddManual = () => {
    if (manualInput.trim()) {
      addManualItem(manualInput.trim());
      setManualInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddManual();
    }
  };

  return (
    <div className={cn("min-h-screen", isMobile ? "pt-20" : "")}>
      <div className={cn(isMobile ? "px-4 py-4" : "px-6 py-6")}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Camera size={28} className="text-foreground" />
            <h1 className="text-2xl font-bold">{t('scan.title')}</h1>
          </div>
          <p className="text-muted-foreground">
            {t('scan.uploadDescription')}
          </p>
        </div>

        <div className={cn(
          "grid gap-6",
          !isMobile && "lg:grid-cols-3"
        )}>
          {/* Main Content */}
          <div className={cn(!isMobile && "lg:col-span-2", "space-y-4")}>
            {/* Image Uploader */}
            <ImageUploader 
              onImageCapture={scanImage}
              isLoading={isScanning}
            />

            {/* Manual Add */}
            <div className="flex gap-2">
              <Input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('scan.addManually')}
                className="flex-1 border-2 border-foreground rounded-xl"
              />
              <Button 
                onClick={handleAddManual}
                disabled={!manualInput.trim()}
                className="shrink-0"
              >
                <Plus size={18} />
              </Button>
            </div>

            {/* Parsed Items */}
            {items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">
                    {t('scan.itemsFound', { count: items.length })}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearList}
                    className="gap-2 border-2 border-foreground text-destructive hover:text-destructive"
                  >
                    <Trash2 size={14} />
                    {t('scan.clearList')}
                  </Button>
                </div>
                
                {items.map((item) => (
                  <GroceryItemCard
                    key={item.id}
                    item={item}
                    onQuantityChange={(qty) => updateItemQuantity(item.id, qty)}
                    onSelectProduct={(product) => selectProduct(item.id, product)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {items.length === 0 && !isScanning && (
              <div className="text-center py-8">
                <Camera size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Scan your grocery list</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Take a photo of your handwritten or printed list and we'll find the best prices for you
                </p>
              </div>
            )}
          </div>

          {/* Summary Sidebar */}
          {items.length > 0 && (
            <div className={cn(
              isMobile ? "mt-4" : "lg:sticky lg:top-6 lg:self-start"
            )}>
              <ListSummary totals={totals} />
              
              <Button
                className="w-full mt-4 gap-2"
                size="lg"
                onClick={() => clearList()}
                variant="outline"
              >
                <Camera size={18} />
                {t('scan.scanAnother')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scan;
