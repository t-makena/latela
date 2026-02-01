// Scraper configuration

export const DEFAULT_CONFIG = {
  headless: true,
  timeout: 60000,
  requestDelay: 2000,
  maxRetries: 3,
  screenshotOnError: true,
};

// Store configurations
export const STORES = {
  checkers: {
    name: 'Checkers',
    enabled: true,
  },
  shoprite: {
    name: 'Shoprite',
    enabled: true,
  },
  pnp: {
    name: 'Pick n Pay',
    enabled: true,
  },
  woolworths: {
    name: 'Woolworths',
    enabled: true,
  },
  makro: {
    name: 'Makro',
    enabled: true,
  },
} as const;

export type StoreKey = keyof typeof STORES;

// User agents for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
