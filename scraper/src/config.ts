import { ScraperConfig } from './types';

export const DEFAULT_CONFIG: ScraperConfig = {
  baseUrl: 'https://www.checkers.co.za',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  timeout: 60000,           // 60 seconds page timeout
  retryAttempts: 3,
  retryDelay: 5000,         // 5 seconds between retries
  requestDelay: 2000,       // 2 seconds between requests (respectful scraping)
  maxConcurrent: 2,         // Only 2 concurrent pages
  headless: true,           // Run headless in CI
  screenshotOnError: true,
};

// User agents rotation for more natural traffic patterns
export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
];

export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Store configurations
export const STORES = {
  checkers: {
    name: 'Checkers',
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
    enabled: false, // Add scraper later
  },
} as const;

export type StoreKey = keyof typeof STORES;
