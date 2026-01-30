/**
 * Shared utilities for merchant name extraction, normalization, and fuzzy matching.
 * Used across the application to ensure consistent merchant identification.
 */

/**
 * Display name mappings for known South African merchants.
 * Keys should be uppercase for matching.
 */
const DISPLAY_NAME_MAP: Record<string, string> = {
  'PNP': 'Pick n Pay',
  'PICK N PAY': 'Pick n Pay',
  'PICKNPAY': 'Pick n Pay',
  'SHOPRITE': 'Shoprite',
  'SUPERSPAR': 'SuperSpar',
  'SPAR': 'Spar',
  'KWIKSPAR': 'KwikSpar',
  'WOOLWORTHS': 'Woolworths',
  'WOOLIES': 'Woolworths',
  'CHECKERS': 'Checkers',
  'USAVE': 'USave',
  'KFC': 'KFC',
  'MCD': "McDonald's",
  'MCDONALDS': "McDonald's",
  'NANDOS': "Nando's",
  'STEERS': 'Steers',
  'DEBONAIRS': 'Debonairs',
  'ROMANS': "Roman's Pizza",
  'ENGEN': 'Engen',
  'SHELL': 'Shell',
  'BP': 'BP',
  'CALTEX': 'Caltex',
  'SASOL': 'Sasol',
  'CLICKS': 'Clicks',
  'DISCHEM': 'Dis-Chem',
  'DIS-CHEM': 'Dis-Chem',
  'TAKEALOT': 'Takealot',
  'MRPRICE': 'Mr Price',
  'MR PRICE': 'Mr Price',
  'FOSCHINI': 'Foschini',
  'EDGARS': 'Edgars',
  'JET': 'Jet',
  'TRUWORTHS': 'Truworths',
  'VODACOM': 'Vodacom',
  'MTN': 'MTN',
  'TELKOM': 'Telkom',
  'CELLC': 'Cell C',
  'CAPITEC': 'Capitec',
  'FNB': 'FNB',
  'ABSA': 'Absa',
  'NEDBANK': 'Nedbank',
  'STANDARDBANK': 'Standard Bank',
  'MAKRO': 'Makro',
  'GAME': 'Game',
  'BUILDERS': 'Builders Warehouse',
  'CASHBUILD': 'Cashbuild',
};

/**
 * Location abbreviations commonly found in SA transaction descriptions.
 */
const LOCATION_ABBREVS: Record<string, string> = {
  'VOSL': 'Vosloorus',
  'VOSLO': 'Vosloorus',
  'JHB': 'Johannesburg',
  'PTA': 'Pretoria',
  'CPT': 'Cape Town',
  'DBN': 'Durban',
  'PE': 'Port Elizabeth',
  'BFN': 'Bloemfontein',
  'EL': 'East London',
  'SANDTON': 'Sandton',
  'ROSEBANK': 'Rosebank',
  'MENLYN': 'Menlyn',
  'GATEWAY': 'Gateway',
  'MALL OF AFRICA': 'Mall of Africa',
};

/**
 * Store type codes to remove (they add no value for display).
 */
const STORE_CODES_TO_REMOVE = ['CRP', 'FAM', 'VC', 'HC', 'LIQ', 'EXP'];

/**
 * Noise patterns to remove from transaction descriptions.
 */
const NOISE_PATTERNS = [
  /\d{4}\*\d{4}/g,                           // Card masks: 5222*2822
  /\*{2,}\d+/g,                              // Card masks: **2822, ****1234
  /\d{2}\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/gi,  // Dates: 28 JAN
  /\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/g, // ISO dates: 2026-01-28T10:34:59
  /\d{2}H\d{2}(:\d{2})?/g,                   // Timestamps: 17H33:45, 10H31
  /CHEQUE CARD PURCHASE/gi,
  /PREPAID MOBILE PURCHASE/gi,
  /AUTOBANK CASH WITHDRAWAL AT/gi,
  /CASH WITHDRAWAL/gi,
  /IB TRANSFER (FROM|TO)/gi,
  /PAYSHAP PAYMENT (FROM|TO)/gi,
  /VAS\d{10,}/g,                             // Reference: VAS00182812693
  /VODA\d{10}/g,                             // Vodacom ref: VODA0636844044
  /\b[A-Z]{3}\d{6,}\b/g,                     // Generic refs: ABC123456
  /\b0{4}[A-Z0-9]{4}\b/g,                    // Refs like 0000B867
  /\bZAF?\b/gi,                              // Country codes
  /\s+/g,                                    // Normalize whitespace (applied last)
];

/**
 * Intelligently shortens and formats a transaction description for display.
 * Removes noise (card numbers, dates, refs) and expands abbreviations.
 * 
 * @param description - Raw transaction description
 * @returns Clean, user-friendly display name
 */
export const smartDisplayName = (description: string): string => {
  if (!description) return '';
  
  let text = description.toUpperCase().trim();
  
  // 1. Handle fee transactions specially
  if (text.includes('FEE:') || text.includes('FEE ')) {
    // Remove duplicate fee patterns
    text = text.replace(/(FEE:\s*\w+(\s+\w+)?)\s*\1/gi, '$1');
    
    if (text.includes('PAYSHAP')) return 'Payshap Fee';
    if (text.includes('PREPAID') || text.includes('AIRTIME') || text.includes('MOBILE')) return 'Airtime Fee';
    if (text.includes('WITHDRAWAL') || text.includes('ATM')) return 'ATM Fee';
    if (text.includes('TRANSFER')) return 'Transfer Fee';
    
    // Generic fee extraction
    const feeMatch = text.match(/FEE:\s*(\w+)/i);
    if (feeMatch) {
      return toTitleCase(feeMatch[1]) + ' Fee';
    }
  }
  
  // Handle duplicate withdrawal fee
  if (text.includes('CASH WITHDRAWAL FEE')) {
    return 'ATM Fee';
  }
  
  // 2. Handle ATM/Cash withdrawals
  if (text.includes('AUTOBANK') || text.includes('CASH WITHDRAWAL') || text.includes('ATM')) {
    if (!text.includes('FEE')) {
      return 'ATM Withdrawal';
    }
  }
  
  // 3. Handle transfers
  if (text.includes('TRANSFER FROM') || text.includes('IB TRANSFER FROM')) {
    // Try to extract sender name
    const senderMatch = text.match(/(?:FROM|TO)\s+([A-Z][A-Z\s]+?)(?:\s+\d|\s*$)/i);
    if (senderMatch && senderMatch[1].trim().length > 1) {
      return 'Transfer from ' + toTitleCase(senderMatch[1].trim());
    }
    return 'Transfer In';
  }
  if (text.includes('TRANSFER TO') || text.includes('IB TRANSFER TO')) {
    const recipientMatch = text.match(/(?:TO)\s+([A-Z][A-Z\s]+?)(?:\s+\d|\s*$)/i);
    if (recipientMatch && recipientMatch[1].trim().length > 1) {
      return 'Transfer to ' + toTitleCase(recipientMatch[1].trim());
    }
    return 'Transfer Out';
  }
  
  // 4. Handle PayShap payments
  if (text.includes('PAYSHAP')) {
    const nameMatch = text.match(/^([A-Z]+)\s+PAYSHAP/i);
    if (nameMatch && nameMatch[1].length > 1) {
      return toTitleCase(nameMatch[1]);
    }
    return 'PayShap Payment';
  }
  
  // 5. Handle airtime/prepaid
  if (text.includes('PREPAID MOBILE') || text.includes('AIRTIME')) {
    if (text.includes('VODA')) return 'Vodacom Airtime';
    if (text.includes('MTN')) return 'MTN Airtime';
    if (text.includes('CELLC') || text.includes('CELL C')) return 'Cell C Airtime';
    if (text.includes('TELKOM')) return 'Telkom Airtime';
    return 'Airtime';
  }
  
  // 6. Handle payment gateway prefixes (YOCO, C*, DNH*, S2S*, etc.)
  const gatewayMatch = text.match(/^(YOCO|C|DNH|S2S)\s*\*\s*([A-Z0-9][A-Z0-9\s\.]+)/i);
  if (gatewayMatch) {
    const merchantName = gatewayMatch[2].replace(/\s+/g, ' ').trim();
    // Clean the merchant name
    let cleanName = merchantName;
    NOISE_PATTERNS.forEach(pattern => {
      cleanName = cleanName.replace(pattern, ' ');
    });
    cleanName = cleanName.trim();
    
    // Check if it's a known brand like BP
    if (gatewayMatch[1].toUpperCase() === 'C' && cleanName.startsWith('BP')) {
      return 'BP ' + toTitleCase(cleanName.substring(2).trim());
    }
    if (gatewayMatch[2].includes('GODADDY')) {
      return 'GoDaddy';
    }
    
    return toTitleCase(cleanName.split(/\s+/)[0]);
  }
  
  // 7. Remove noise patterns
  NOISE_PATTERNS.forEach(pattern => {
    text = text.replace(pattern, ' ');
  });
  text = text.replace(/\s+/g, ' ').trim();
  
  // 8. Remove store type codes
  STORE_CODES_TO_REMOVE.forEach(code => {
    text = text.replace(new RegExp(`\\b${code}\\b`, 'gi'), '');
  });
  text = text.replace(/\s+/g, ' ').trim();
  
  // 9. Split into words and process
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return description;
  
  // 10. Check first word(s) for known merchants
  const firstWord = words[0];
  const firstTwoWords = words.slice(0, 2).join(' ');
  
  let merchantName = DISPLAY_NAME_MAP[firstWord] || DISPLAY_NAME_MAP[firstTwoWords];
  let remainingWords = merchantName ? (DISPLAY_NAME_MAP[firstTwoWords] ? words.slice(2) : words.slice(1)) : words.slice(1);
  
  if (!merchantName) {
    merchantName = toTitleCase(firstWord);
  }
  
  // 11. Check for location in remaining words
  let location = '';
  const processedRemaining: string[] = [];
  
  for (const word of remainingWords) {
    const expandedLocation = LOCATION_ABBREVS[word];
    if (expandedLocation && !location) {
      location = expandedLocation;
    } else if (!STORE_CODES_TO_REMOVE.includes(word) && word.length > 1) {
      // Only keep meaningful words (not single chars or store codes)
      const expanded = LOCATION_ABBREVS[word];
      if (expanded) {
        if (!location) location = expanded;
      } else if (!/^\d+$/.test(word)) {
        // Don't include pure numbers
        processedRemaining.push(word);
      }
    }
  }
  
  // 12. Build final display name
  let result = merchantName;
  if (location) {
    result += ' ' + location;
  } else if (processedRemaining.length > 0 && processedRemaining[0].length > 2) {
    // Add first remaining meaningful word as location hint
    const nextWord = processedRemaining[0];
    if (!/^\d/.test(nextWord) && !DISPLAY_NAME_MAP[nextWord]) {
      result += ' ' + toTitleCase(nextWord);
    }
  }
  
  return result.trim();
};

/**
 * Converts a string to title case, handling special cases.
 */
const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length <= 2) return word.toUpperCase(); // Keep short words like 'BP' uppercase
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

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
 * Uses intelligent shortening to create clean, readable merchant names.
 * 
 * @param description - Raw transaction description
 * @returns Display-friendly merchant name
 */
export const extractDisplayMerchantName = (description: string): string => {
  if (!description) return '';
  return smartDisplayName(description);
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
