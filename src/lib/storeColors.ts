export type StoreKey = 'pnp' | 'checkers' | 'shoprite' | 'woolworths' | 'makro';

export interface StoreColorConfig {
  bg: string;
  text: string;
  border: string;
  name: string;
}

export const storeColors: Record<StoreKey, StoreColorConfig> = {
  pnp: { 
    bg: 'bg-blue-100', 
    text: 'text-blue-800', 
    border: 'border-blue-300',
    name: 'Pick n Pay' 
  },
  checkers: { 
    bg: 'bg-red-100', 
    text: 'text-red-800', 
    border: 'border-red-300',
    name: 'Checkers' 
  },
  shoprite: { 
    bg: 'bg-red-100', 
    text: 'text-red-800', 
    border: 'border-red-300',
    name: 'Shoprite' 
  },
  woolworths: { 
    bg: 'bg-green-100', 
    text: 'text-green-800', 
    border: 'border-green-300',
    name: 'Woolworths' 
  },
  makro: { 
    bg: 'bg-orange-100', 
    text: 'text-orange-800', 
    border: 'border-orange-300',
    name: 'Makro' 
  }
};

export const getStoreDisplayName = (store: string): string => {
  const key = store.toLowerCase() as StoreKey;
  return storeColors[key]?.name || store;
};

export const formatPriceCents = (cents: number): string => {
  return `R${(cents / 100).toFixed(2)}`;
};
