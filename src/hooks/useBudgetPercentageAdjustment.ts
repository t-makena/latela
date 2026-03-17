import { useMemo, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BudgetAdjustmentStrategy = 'proportional' | 'needs_first' | 'wants_first' | 'equal';

export interface BudgetPercentageParams {
  currentNeeds: number;
  currentWants: number;
  currentSavings: number;
  targetSavings: number;
  strategy: BudgetAdjustmentStrategy;
}

export interface BudgetPercentageResult {
  adjustedNeeds: number;
  adjustedWants: number;
  adjustedSavings: number;
  isValid: boolean;
  applyAdjustment: () => { needs: number; wants: number; savings: number };
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Clamp each value to [0, 100] and then scale so all three sum to exactly 100.
 * If all three are zero, fall back to the 50/30/20 default.
 */
function normalize(needs: number, wants: number, savings: number): [number, number, number] {
  const n = Math.max(0, Math.min(100, needs));
  const w = Math.max(0, Math.min(100, wants));
  const s = Math.max(0, Math.min(100, savings));
  const total = n + w + s;
  if (total === 0) return [50, 30, 20];
  const scale = 100 / total;
  // Round to two decimal places; give any rounding residual to needs
  const rNeeds = Math.round(n * scale * 100) / 100;
  const rWants = Math.round(w * scale * 100) / 100;
  const rSavings = Math.round(s * scale * 100) / 100;
  const residual = Math.round((100 - rNeeds - rWants - rSavings) * 100) / 100;
  return [rNeeds + residual, rWants, rSavings];
}

/**
 * Given a target savings percentage, compute how needs and wants should be
 * redistributed so that needs + wants = 100 - targetSavings.
 */
function rebalanceNeedsWants(
  currentNeeds: number,
  currentWants: number,
  remaining: number,
  strategy: BudgetAdjustmentStrategy,
): { needs: number; wants: number } {
  if (remaining <= 0) return { needs: 0, wants: 0 };

  const currentOther = currentNeeds + currentWants;

  switch (strategy) {
    case 'proportional': {
      if (currentOther === 0) return { needs: remaining / 2, wants: remaining / 2 };
      const ratio = currentNeeds / currentOther;
      return {
        needs: Math.round(remaining * ratio * 100) / 100,
        wants: Math.round(remaining * (1 - ratio) * 100) / 100,
      };
    }

    case 'needs_first': {
      const delta = remaining - currentOther;
      if (delta <= 0) {
        // Reduction — needs absorbs it first
        const needsCut = Math.min(-delta, currentNeeds);
        const wantsCut = -delta - needsCut;
        return { needs: currentNeeds - needsCut, wants: currentWants - wantsCut };
      } else {
        // Increase — needs gets the bonus first
        const newNeeds = Math.min(remaining, currentNeeds + delta);
        return { needs: newNeeds, wants: remaining - newNeeds };
      }
    }

    case 'wants_first': {
      const delta = remaining - currentOther;
      if (delta <= 0) {
        // Reduction — wants absorbs it first
        const wantsCut = Math.min(-delta, currentWants);
        const needsCut = -delta - wantsCut;
        return { needs: currentNeeds - needsCut, wants: currentWants - wantsCut };
      } else {
        // Increase — wants gets the bonus first
        const newWants = Math.min(remaining, currentWants + delta);
        return { needs: remaining - newWants, wants: newWants };
      }
    }

    case 'equal': {
      const delta = remaining - currentOther;
      const half = delta / 2;
      // Try to split delta evenly; clamp negatives
      const newNeeds = Math.max(0, currentNeeds + half);
      const newWants = Math.max(0, remaining - newNeeds);
      return { needs: Math.round(newNeeds * 100) / 100, wants: Math.round(newWants * 100) / 100 };
    }
  }
}

// ─── Exported pure function ───────────────────────────────────────────────────

/**
 * Pure (non-hook) version for use inside event handlers.
 * Returns the adjusted percentages given a new target savings value.
 */
export function calculateBudgetAdjustment({
  currentNeeds,
  currentWants,
  targetSavings,
  strategy,
}: Omit<BudgetPercentageParams, 'currentSavings'>): {
  needs: number;
  wants: number;
  savings: number;
} {
  const clampedSavings = Math.max(0, Math.min(100, targetSavings));
  const remaining = 100 - clampedSavings;
  const { needs, wants } = rebalanceNeedsWants(currentNeeds, currentWants, remaining, strategy);
  const [n, w, s] = normalize(needs, wants, clampedSavings);
  return { needs: n, wants: w, savings: s };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Memoized hook that derives adjusted budget percentages whenever
 * targetSavings or the chosen strategy changes.
 *
 * Use `applyAdjustment()` to get the final triple in callbacks/mutations.
 * Use `calculateBudgetAdjustment()` (exported above) for imperative/event use.
 */
export const useBudgetPercentageAdjustment = ({
  currentNeeds,
  currentWants,
  currentSavings,
  targetSavings,
  strategy,
}: BudgetPercentageParams): BudgetPercentageResult => {
  const { adjustedNeeds, adjustedWants, adjustedSavings } = useMemo(() => {
    const { needs, wants, savings } = calculateBudgetAdjustment({
      currentNeeds,
      currentWants,
      targetSavings,
      strategy,
    });
    return { adjustedNeeds: needs, adjustedWants: wants, adjustedSavings: savings };
  }, [currentNeeds, currentWants, targetSavings, strategy]);

  // currentSavings is included in deps so callers can detect when there is
  // actually a change to apply (adjustedSavings !== currentSavings).
  const isValid = useMemo(
    () => Math.abs(adjustedNeeds + adjustedWants + adjustedSavings - 100) < 0.01,
    [adjustedNeeds, adjustedWants, adjustedSavings],
  );

  const applyAdjustment = useCallback(
    () => ({ needs: adjustedNeeds, wants: adjustedWants, savings: adjustedSavings }),
    [adjustedNeeds, adjustedWants, adjustedSavings],
  );

  return { adjustedNeeds, adjustedWants, adjustedSavings, isValid, applyAdjustment };
};
