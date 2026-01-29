import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

export type StoreFilter = 'all' | 'checkers' | 'makro' | 'pnp' | 'woolworths';

interface StoreFilterPillsProps {
  selectedStore: StoreFilter;
  onStoreChange: (store: StoreFilter) => void;
}

const stores: { key: StoreFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'checkers', label: 'Checkers' },
  { key: 'makro', label: 'Makro' },
  { key: 'pnp', label: 'PnP' },
  { key: 'woolworths', label: 'Woolies' },
];

export const StoreFilterPills = ({ selectedStore, onStoreChange }: StoreFilterPillsProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-wrap gap-2">
      {stores.map((store) => {
        const isSelected = selectedStore === store.key;
        const isAll = store.key === 'all';
        
        return (
          <button
            key={store.key}
            onClick={() => onStoreChange(store.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border-2",
              isSelected && isAll && "bg-amber-400 border-amber-400 text-foreground",
              isSelected && !isAll && "bg-foreground border-foreground text-background",
              !isSelected && "bg-background border-foreground text-foreground hover:bg-accent"
            )}
          >
            {store.key === 'all' ? t('groceryBudget.filterAll') : store.label}
          </button>
        );
      })}
    </div>
  );
};
