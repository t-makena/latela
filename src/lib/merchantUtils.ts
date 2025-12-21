/**
 * Shared utilities for merchant name extraction and normalization.
 * Used across the application to ensure consistent merchant identification.
 */

/**
 * Extracts and normalizes merchant name from a transaction description.
 * Removes common transaction prefixes, card numbers, dates, and extra whitespace.
 * 
 * @param description - Raw transaction description
 * @returns Normalized uppercase merchant name
 */
export const normalizeMerchantName = (description: string): string => {
  if (!description) return '';
  
  let merchant = description
    // Remove common transaction prefixes
    .replace(/\bPURCHASE\b|\bDEBIT\b|\bCREDIT\b|\bPAYMENT\b|\bTRANSFER\b|\bPOS\b|\bATM\b|\bEFT\b/gi, '')
    // Remove card numbers (e.g., "CARD 1234" or "****1234")
    .replace(/\bCARD\s+\d+/gi, '')
    .replace(/\*+\d+/g, '')
    // Remove dates in various formats
    .replace(/\d{2}\/\d{2}\/\d{4}/g, '')
    .replace(/\d{4}-\d{2}-\d{2}/g, '')
    .replace(/\d{2}-\d{2}-\d{4}/g, '')
    .replace(/\d{2}\.\d{2}\.\d{4}/g, '')
    // Remove time patterns
    .replace(/\d{2}:\d{2}(:\d{2})?/g, '')
    // Remove reference numbers (common patterns)
    .replace(/REF\s*[:.]?\s*\d+/gi, '')
    .replace(/\bTXN\s*[:.]?\s*\d+/gi, '')
    // Remove currency amounts that might be in description
    .replace(/R?\d+[.,]\d{2}/g, '')
    // Remove trailing numbers that might be transaction IDs
    .replace(/\s+\d{6,}$/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
  
  // If description contains multiple parts separated by spaces, take the first meaningful part
  const parts = merchant.split(/\s{2,}/);
  merchant = parts[0] || merchant;
  
  // Limit length and uppercase for consistent matching
  return merchant.substring(0, 100).toUpperCase();
};

/**
 * Extracts a display-friendly merchant name from a transaction description.
 * Similar to normalizeMerchantName but preserves original casing for display.
 * 
 * @param description - Raw transaction description
 * @returns Display-friendly merchant name (title case)
 */
export const extractDisplayMerchantName = (description: string): string => {
  if (!description) return '';
  
  const normalized = normalizeMerchantName(description);
  
  // Convert to title case for display
  return normalized
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Checks if two merchant names are considered the same after normalization.
 * 
 * @param name1 - First merchant name or description
 * @param name2 - Second merchant name or description
 * @returns True if both normalize to the same merchant name
 */
export const isSameMerchant = (name1: string, name2: string): boolean => {
  return normalizeMerchantName(name1) === normalizeMerchantName(name2);
};
