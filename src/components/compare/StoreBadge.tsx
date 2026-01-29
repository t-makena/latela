import { cn } from '@/lib/utils';
import { storeColors, StoreKey } from '@/lib/storeColors';

interface StoreBadgeProps {
  store: string;
  className?: string;
}

export const StoreBadge = ({ store, className }: StoreBadgeProps) => {
  const storeKey = store.toLowerCase() as StoreKey;
  const colors = storeColors[storeKey] || { bg: 'bg-gray-100', text: 'text-gray-800', name: store };
  
  return (
    <span 
      className={cn(
        'px-2 py-1 rounded-full text-xs font-semibold',
        colors.bg,
        colors.text,
        className
      )}
    >
      {colors.name}
    </span>
  );
};
