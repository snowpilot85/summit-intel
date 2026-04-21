import type { CCMRReadiness, IndicatorType, IndicatorStatus } from '@/types/database'

export interface IndicatorInput {
  indicator_type: IndicatorType
  status: IndicatorStatus
}

// ─────────────────────────────────────────────────────────────────────────────
// TEA CCMR indicator classification
//
// STANDALONE: each independently satisfies CCMR. Meeting ANY ONE = CCMR Met.
//   - tsi_reading and tsi_math are separate indicators; each alone counts.
//   - college_prep, dual_credit, and career indicators are all standalone.
//
// PAIRED (SAT, ACT): require BOTH subscores in the same administration.
//   - sat_reading (EBRW ≥ 480) AND sat_math (Math ≥ 530) → one CCMR indicator
//   - act_reading (English ≥ 19) AND act_math (Math ≥ 19) → one CCMR indicator
//
// SAT/ACT subscores CAN independently satisfy TSI exemptions (stored as
// tsi_reading / tsi_math rows with derivation_source = 'sat' | 'act').
// ─────────────────────────────────────────────────────────────────────────────

const STANDALONE_INDICATORS: IndicatorType[] = [
  // TSI — each subject independently satisfies CCMR
  'tsi_reading',
  'tsi_math',
  // College Prep — each course independently satisfies CCMR
  'college_prep_ela',
  'college_prep_math',
  // Dual Credit — each pathway independently satisfies CCMR
  'dual_credit_ela',
  'dual_credit_math',
  'dual_credit_any',
  // Test-based
  'ap_exam',
  'ib_exam',
  // Career
  'onramps',
  'ibc',
  'associate_degree',
  'level_i_ii_certificate',
  'military_enlistment',
  'iep_completion',
  'sped_advanced_degree',
]

function isMet(indicators: IndicatorInput[], type: IndicatorType): boolean {
  return indicators.some((i) => i.indicator_type === type && i.status === 'met')
}

/** SAT College Ready: BOTH EBRW ≥ 480 AND Math ≥ 530 required. */
function checkSatMet(indicators: IndicatorInput[]): boolean {
  return isMet(indicators, 'sat_reading') && isMet(indicators, 'sat_math')
}

/** ACT College Ready: BOTH English ≥ 19 AND Math ≥ 19 required. */
function checkActMet(indicators: IndicatorInput[]): boolean {
  return isMet(indicators, 'act_reading') && isMet(indicators, 'act_math')
}

/**
 * "Almost" (senior-specific): one subscore of a paired indicator is met but
 * not both. Only SAT and ACT can produce this state — standalone indicators
 * fully satisfy CCMR on their own so they never produce "almost".
 */
function checkAlmost(indicators: IndicatorInput[]): boolean {
  const satR = isMet(indicators, 'sat_reading')
  const satM = isMet(indicators, 'sat_math')
  if (satR !== satM) return true

  const actR = isMet(indicators, 'act_reading')
  const actM = isMet(indicators, 'act_math')
  if (actR !== actM) return true

  return false
}

function hasAnyActivity(indicators: IndicatorInput[]): boolean {
  return indicators.some((i) => i.status === 'met' || i.status === 'in_progress')
}

/**
 * Counts the number of distinct CCMR pathways a student has met.
 *
 * - Each standalone indicator that is met = 1 pathway.
 * - SAT (both subscores met) = 1 pathway.
 * - ACT (both subscores met) = 1 pathway.
 *
 * This is the correct value for students.indicators_met_count.
 */
export function countCCMRPathways(indicators: IndicatorInput[]): number {
  let count = 0
  for (const t of STANDALONE_INDICATORS) {
    if (isMet(indicators, t)) count++
  }
  if (checkSatMet(indicators)) count++
  if (checkActMet(indicators)) count++
  return count
}

/**
 * Computes a student's CCMR readiness status from their indicator records.
 * Pure business logic — no side effects, no Supabase dependency.
 */
export function computeCCMRReadiness(
  indicators: IndicatorInput[],
  gradeLevel: number
): CCMRReadiness {
  // Any standalone indicator met → CCMR Met
  if (STANDALONE_INDICATORS.some((t) => isMet(indicators, t))) return 'met'
  // SAT College Ready (both subscores required)
  if (checkSatMet(indicators)) return 'met'
  // ACT College Ready (both subscores required)
  if (checkActMet(indicators)) return 'met'

  // Senior-specific tiers
  if (gradeLevel === 12) {
    // One SAT or ACT subscore met but not both → "almost" (one step away)
    if (checkAlmost(indicators)) return 'almost'
    // Any in-progress work → "on_track"
    if (indicators.some((i) => i.status === 'in_progress')) return 'on_track'
    return 'at_risk'
  }

  // Grade 9–10 with no activity whatsoever
  if (gradeLevel <= 10 && !hasAnyActivity(indicators)) return 'too_early'

  return 'on_track'
}
