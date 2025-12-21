/**
 * Shared utilities for merchant name extraction, normalization, and fuzzy matching.
 * Used across the application to ensure consistent merchant identification.
 */

/**
 * Common South African merchant aliases - maps abbreviations to full names.
 * Each brand is distinct for fuzzy matching - no cross-brand aliases.
 */
export const MERCHANT_ALIASES: Record<string, string[]> = {
  'MCD': ['MCDONALDS', 'MCDONALD', "MCDONALD'S", 'MCDS'],
  'MCDONALDS': ['MCD', 'MCDS', "MCDONALD'S"],
  'PNP': ['PICK N PAY', 'PICKNPAY', 'PICK-N-PAY', 'PICKPAY'],
  'PICK': ['PNP', 'PICKNPAY'],
  // Shoprite brand - distinct from Checkers
  'SHOPRITE': ['SHOPRITE HYPER'],
  // USave brand - distinct display but grouped with Shoprite for analytics
  'USAVE': ['U-SAVE', 'U SAVE'],
  // Checkers brand - completely separate from Shoprite
  'CHECKERS': ['CHECKERS HYPER', 'CHECKERS SIXTY60', 'CHECKERS LIQUOR', 'CHECKERS LIQ'],
  'SPAR': ['SUPERSPAR', 'KWIKSPAR', 'SPAR EXPRESS'],
  'SUPERSPAR': ['SPAR', 'KWIKSPAR'],
  'WOOLWORTHS': ['WOOLIES', 'W/WORTHS'],
  'WOOLIES': ['WOOLWORTHS', 'W/WORTHS'],
  'KFC': ['KENTUCKY', 'KENTUCKY FRIED'],
  'KENTUCKY': ['KFC'],
  'ENGEN': ['ENGEN GARAGE', 'ENGEN SERVICE'],
  'SHELL': ['SHELL GARAGE', 'SHELL SERVICE'],
  'BP': ['BP GARAGE', 'BP SERVICE'],
  'CALTEX': ['CALTEX GARAGE', 'CALTEX SERVICE'],
  'SASOL': ['SASOL GARAGE'],
  'CLICKS': ['CLICKS PHARMACY'],
  'DISCHEM': ['DIS-CHEM', 'DISCHEM PHARMACY'],
  'TAKEALOT': ['TAKEALOT.COM'],
  'UBER': ['UBER EATS', 'UBEREATS'],
  'MR': ['MRPRICE', 'MR PRICE', 'MRP'],
  'MRPRICE': ['MR PRICE', 'MRP', 'MR'],
};

/**
 * Merchant groups for backend analytics - groups related brands under same parent company.
 * Use getMerchantGroup() to find which group a merchant belongs to.
 */
export const MERCHANT_GROUPS: Record<string, string[]> = {
  'SHOPRITE_GROUP': ['SHOPRITE', 'USAVE', 'U-SAVE'],
  'PICK_N_PAY_GROUP': ['PNP', 'PICK N PAY', 'PICKNPAY', 'BOXER'],
  'SPAR_GROUP': ['SPAR', 'SUPERSPAR', 'KWIKSPAR', 'SPAR EXPRESS'],
  'WOOLWORTHS_GROUP': ['WOOLWORTHS', 'WOOLIES'],
  'CHECKERS_GROUP': ['CHECKERS', 'CHECKERS HYPER', 'CHECKERS SIXTY60'],
  'CLICKS_GROUP': ['CLICKS', 'CLICKS PHARMACY'],
  'DISCHEM_GROUP': ['DISCHEM', 'DIS-CHEM'],
  'ENGEN_GROUP': ['ENGEN'],
  'SHELL_GROUP': ['SHELL'],
  'BP_GROUP': ['BP'],
  'MCDONALDS_GROUP': ['MCD', 'MCDONALDS', "MCDONALD'S"],
  'KFC_GROUP': ['KFC', 'KENTUCKY'],
};

/**
 * Gets the analytics group for a merchant name.
 * Used for backend reporting to group related brands (e.g., Shoprite + USave).
 * 
 * @param merchantName - The merchant name to look up
 * @returns Group name or null if not in any group
 */
export const getMerchantGroup = (merchantName: string): string | null => {
  if (!merchantName) return null;
  
  const core = extractMerchantCore(merchantName);
  
  for (const [group, members] of Object.entries(MERCHANT_GROUPS)) {
    if (members.some(m => m === core || core.startsWith(m) || m.startsWith(core))) {
      return group;
    }
  }
  
  return null;
};

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
 * Extracts the core identifier from a merchant name (first significant word).
 * Used for fuzzy matching to catch variations like "MCD RONDEBOSCH" vs "MCD CAVENDISH".
 * 
 * @param description - Raw or normalized merchant name/description
 * @returns Core merchant identifier (uppercase)
 */
export const extractMerchantCore = (description: string): string => {
  if (!description) return '';
  
  const normalized = normalizeMerchantName(description);
  
  // Skip common prefixes
  let cleaned = normalized.replace(/^(THE|A|AN)\s+/i, '');
  
  // Get the first word
  const firstWord = cleaned.split(' ')[0] || cleaned;
  
  // Return if at least 2 characters
  return firstWord.length >= 2 ? firstWord : cleaned;
};

/**
 * Calculates Levenshtein distance between two strings.
 * 
 * @param a - First string
 * @param b - Second string
 * @returns Edit distance between the strings
 */
export const levenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

/**
 * Calculates similarity score between two merchant names.
 * Uses multiple matching strategies and returns highest score.
 * 
 * @param name1 - First merchant name
 * @param name2 - Second merchant name
 * @returns Similarity score between 0 and 1
 */
export const calculateMerchantSimilarity = (name1: string, name2: string): number => {
  if (!name1 || !name2) return 0;
  
  const normalized1 = normalizeMerchantName(name1);
  const normalized2 = normalizeMerchantName(name2);
  
  // Exact match
  if (normalized1 === normalized2) return 1.0;
  
  const core1 = extractMerchantCore(name1);
  const core2 = extractMerchantCore(name2);
  
  // Core match (e.g., "MCD RONDEBOSCH" vs "MCD CAVENDISH")
  if (core1 === core2 && core1.length >= 2) return 0.95;
  
  // Check alias match
  const aliases1 = MERCHANT_ALIASES[core1] || [];
  const aliases2 = MERCHANT_ALIASES[core2] || [];
  if (aliases1.includes(core2) || aliases2.includes(core1)) return 0.9;
  
  // Prefix match (one starts with the other)
  if (normalized1.startsWith(normalized2) || normalized2.startsWith(normalized1)) {
    return 0.85;
  }
  
  // Core prefix match
  if (core1.length >= 3 && core2.length >= 3) {
    if (core1.startsWith(core2) || core2.startsWith(core1)) {
      return 0.8;
    }
  }
  
  // Contains match (one contains the other, for longer patterns)
  if (core1.length >= 4 && core2.length >= 4) {
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return 0.75;
    }
  }
  
  // Levenshtein distance for short names
  if (core1.length <= 8 && core2.length <= 8) {
    const distance = levenshteinDistance(core1, core2);
    const maxLen = Math.max(core1.length, core2.length);
    const similarity = 1 - (distance / maxLen);
    if (similarity >= 0.7) return similarity * 0.7; // Scale down levenshtein matches
  }
  
  return 0;
};

/**
 * Checks if two merchant names are considered a fuzzy match.
 * 
 * @param name1 - First merchant name
 * @param name2 - Second merchant name
 * @param threshold - Minimum similarity score for a match (default: 0.7)
 * @returns True if names match above threshold
 */
export const isFuzzyMerchantMatch = (name1: string, name2: string, threshold = 0.7): boolean => {
  return calculateMerchantSimilarity(name1, name2) >= threshold;
};

/**
 * Finds the best matching merchant mapping from a list.
 * 
 * @param targetDescription - The transaction description to match
 * @param mappings - Array of merchant mappings to search
 * @returns Best match with score, or null if no match above threshold
 */
export const findBestMerchantMatch = <T extends { merchant_name: string; merchant_pattern?: string | null }>(
  targetDescription: string,
  mappings: T[],
  threshold = 0.7
): { match: T; score: number } | null => {
  if (!targetDescription || !mappings.length) return null;
  
  const targetNormalized = normalizeMerchantName(targetDescription);
  const targetCore = extractMerchantCore(targetDescription);
  
  let bestMatch: { match: T; score: number } | null = null;
  
  for (const mapping of mappings) {
    // Try exact match first
    const mappingNormalized = normalizeMerchantName(mapping.merchant_name);
    if (mappingNormalized === targetNormalized) {
      return { match: mapping, score: 1.0 };
    }
    
    // Try pattern match if available
    if (mapping.merchant_pattern) {
      const patternCore = mapping.merchant_pattern.toUpperCase();
      if (patternCore === targetCore) {
        const score = 0.95;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { match: mapping, score };
        }
        continue;
      }
    }
    
    // Calculate fuzzy similarity
    const score = calculateMerchantSimilarity(mapping.merchant_name, targetDescription);
    if (score >= threshold && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { match: mapping, score };
    }
  }
  
  return bestMatch;
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
