// ─── Prompt Injection Guard ───────────────────────────────────────────────────

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+all\s+previous\s+instructions/i,
  /ignore\s+previous\s+instructions/i,
  /forget\s+everything/i,
  /forget\s+your\s+instructions/i,
  /you\s+are\s+now\s+a\s+different/i,
  /pretend\s+you\s+are/i,
  /pretend\s+to\s+be/i,
  /\[INST\]/i,
  /<\|system\|>/i,
  /system\s+prompt/i,
  /reveal\s+your\s+prompt/i,
  /show\s+me\s+your\s+instructions/i,
  /what\s+are\s+your\s+instructions/i,
  /act\s+as\s+if\s+you\s+have\s+no\s+restrictions/i,
  /jailbreak/i,
  /DAN\s+mode/i,
];

/**
 * Strip dangerous control characters and truncate to a safe length.
 */
export function sanitizeUserInput(text: string): string {
  // Remove control characters: 0x00-0x08, 0x0b, 0x0c, 0x0e-0x1f, 0x7f
  // (preserve \t = 0x09 and \n = 0x0a and \r = 0x0d for readability)
  const cleaned = text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
  return cleaned.slice(0, 2000);
}

/**
 * Returns true if the text contains prompt injection patterns.
 */
export function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}
