import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPriceCents, getStoreDisplayName } from '@/lib/storeColors';
import { StoreBadge } from '@/components/compare/StoreBadge';
import { useLanguage } from '@/hooks/useLanguage';
import { ShoppingCart, Package } from 'lucide-react';

interface ListSummaryProps {
  totals: {
    totalCents: number;
    itemCount: number;
    selectedCount: number;
    needsSelectionCount: number;
    storeBreakdown: Record<string, number>;
  };
}

export const ListSummary = ({ totals }: ListSummaryProps) => {
  const { t } = useLanguage();
  const storeEntries = Object.entries(totals.storeBreakdown).sort((a, b) => b[1] - a[1]);

  return (
    <Card 
      className="border-2 border-foreground bg-card"
      style={{ boxShadow: '4px 4px 0px #000000' }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart size={20} />
          {t('scan.estimatedTotal')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-foreground">
            {formatPriceCents(totals.totalCents)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('scan.itemsFound', { count: totals.itemCount })}
          </p>
        </div>
        
        {totals.needsSelectionCount > 0 && (
          <div className="p-3 bg-amber-100 rounded-lg border border-amber-200 flex items-center gap-2">
            <Package size={16} className="text-amber-700 shrink-0" />
            <p className="text-sm text-amber-800">
              {t('scan.needsSelection', { count: totals.needsSelectionCount })}
            </p>
          </div>
        )}
        
        {storeEntries.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Store breakdown:</p>
            {storeEntries.map(([store, cents]) => (
              <div key={store} className="flex items-center justify-between">
                <StoreBadge store={store} />
                <span className="font-medium">{formatPriceCents(cents)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
