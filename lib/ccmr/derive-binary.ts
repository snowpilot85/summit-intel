// ============================================================
// Binary CCMR Derivation (cohort ≤ 2029)
//
// Wraps the legacy lib/ccmr.ts logic so the recompute service can
// switch on methodology without importing the legacy module
// directly. Behavior is unchanged from the existing binary
// derivation — see lib/ccmr.ts for the rule encoding.
// ============================================================

import {
  computeCCMRReadiness,
  countCCMRPathways,
  type IndicatorInput,
} from '@/lib/ccmr'
import type { BinaryStatus } from '@/types/database'

export interface BinaryDerivationResult {
  highest_level: BinaryStatus
  pathways_met: number
}

/**
 * Binary CCMR result: 'met' if any standalone indicator is met or
 * the SAT/ACT paired requirement is satisfied; 'not_met' otherwise.
 *
 * gradeLevel is required by the legacy readiness function for
 * almost / on-track / too-early classification, but only the
 * met/not-met collapse matters for this output.
 */
export function deriveBinary(
  indicators: IndicatorInput[],
  gradeLevel: number
): BinaryDerivationResult {
  const readiness = computeCCMRReadiness(indicators, gradeLevel)
  return {
    highest_level: readiness === 'met' ? 'met' : 'not_met',
    pathways_met: countCCMRPathways(indicators),
  }
}
